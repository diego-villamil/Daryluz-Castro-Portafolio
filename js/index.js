        // ─────────────────────────────────────────────────────────────
        // CARRUSEL CONTINUO CON MOVIMIENTO FLUIDO (SIN PAUSAS)
        // ─────────────────────────────────────────────────────────────
        // Este carrusel usa CSS animations puras para movimiento infinito

        // ─────────────────────────────────────────────────────────────
        // LAZY LOADING IMAGES
        // ─────────────────────────────────────────────────────────────
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.onload = () => {
                            img.classList.add('loaded');
                            observer.unobserve(img);
                        };
                    }
                }
            });
        });
        document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));

        async function handleFormSubmit(event) {
            event.preventDefault();

            const form = event.target;
            const submitBtn = form.querySelector('.form-submit');

            const name = form.name.value.trim();
            const email = form.email.value.trim();
            const subject = form.subject.value.trim();
            const message = form.message.value.trim();

            if (!name || !email || !subject || !message) {
                showMessage('Por favor completa todos los campos.', 'error');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage('Por favor ingresa un email válido.', 'error');
                return;
            }

            const captchaToken = grecaptcha.getResponse();
            if (!captchaToken) {
                showMessage('Por favor completa el reCAPTCHA antes de enviar.', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message, captchaToken })
                });

                const data = await res.json();

                if (!res.ok) {
                    console.error('API error:', data);
                    throw new Error(data.details || data.error || 'Error al enviar');
                }

                showMessage('Mensaje enviado correctamente.', 'success');
                form.reset();
                grecaptcha.reset();
            } catch (err) {
                console.error('Frontend error:', err);
                showMessage(err.message || 'Error al enviar. Intenta de nuevo.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Mensaje';
            }
        }

        function showMessage(text, type) {
            const el = document.getElementById('formMessage');
            el.textContent = text;
            el.className = `form-message ${type}`;
            setTimeout(() => { el.className = 'form-message'; }, 6000);
        }

        // ─────────────────────────────────────────────────────────────
        // SMOOTH SCROLL
        // ─────────────────────────────────────────────────────────────
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });



        // ── Menú hamburguesa ──
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.querySelector('.nav-links');

        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        // Cierra el menú al hacer clic en un link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });


        // ══════════════════════════════════════════════
        // GALERÍAS POR CATEGORÍA
        // ══════════════════════════════════════════════
        const galleries = {
            personajes: [
                { type: 'img', src: 'image/personaje-2d/Actividad 1 - Diagnóstico_pages-to-jpg-0007.jpg' },
                { type: 'img', src: 'image/personaje-2d/Actividad 1 - Diagnóstico_pages-to-jpg-0009.jpg' },
                { type: 'img', src: 'image/personaje-2d/Cuando los colores hablan - Lily_page-0005.jpg' },
                { type: 'img', src: 'image/personaje-2d/Cuando los colores hablan - Lily_page-0006.jpg' },
                { type: 'img', src: 'image/personaje-2d/Cuando los colores hablan - Lily_page-0007.jpg' },
                { type: 'img', src: 'image/personaje-2d/ELIRA The Ice Guardian.png' },
                { type: 'img', src: 'image/personaje-2d/KAILO EL PERRITO ESPACIAL_page-0003.jpg' },
                { type: 'img', src: 'image/personaje-2d/KAILO EL PERRITO ESPACIAL_page-0004.jpg' },
                { type: 'img', src: 'image/personaje-2d/Time Traveler Lurien.png' }
            ],
            '3d': [
                { type: 'img',   src: 'image/modelado-3d/PARCIAL.png' },
                { type: 'video', src: 'image/modelado-3d/PAISAJE.mp4' }
            ],
            photoshop: [
                { type: 'img', src: 'image/Diseño-photoshop/38f3f101-e2a4-4c3a-8122-b03c7f9efc26.jpg' },
                { type: 'img', src: 'image/Diseño-photoshop/ASI MISMO_page-0001.jpg' },
                { type: 'img', src: 'image/Diseño-photoshop/Poster Propuesta.jpg' },
                { type: 'img', src: 'image/Diseño-photoshop/Tarea propuesta punto de fuga USB_1.jpg' },
                { type: 'img', src: 'image/Diseño-photoshop/Tarea propuesta punto de fuga USB_2.jpg' }
            ]
        };

        const lightbox        = document.getElementById('lightbox');
        const lightboxImg     = document.getElementById('lightboxImg');
        const lightboxVideo   = document.getElementById('lightboxVideo');
        const lightboxCounter = document.getElementById('lightboxCounter');
        const lightboxThumbs  = document.getElementById('lightboxThumbs');

        let lbItems = [];
        let lbIndex = 0;

        function openLightbox(gallery, index) {
            lbItems = galleries[gallery];
            lbIndex = index;
            lightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
            buildThumbs();
            renderLightbox();
        }

        function closeLightbox() {
            lightbox.classList.remove('open');
            document.body.style.overflow = '';
            lightboxVideo.pause();
            lightboxVideo.src = '';
            lightboxVideo.style.display = 'none';
            lightboxImg.style.display   = 'none';
        }

        function renderLightbox() {
            const item = lbItems[lbIndex];
            lightboxCounter.textContent = `${lbIndex + 1} / ${lbItems.length}`;

            document.querySelectorAll('#lightboxThumbs > *')
                .forEach((t, i) => t.classList.toggle('active', i === lbIndex));

            if (item.type === 'img') {
                lightboxVideo.pause();
                lightboxVideo.style.display = 'none';
                lightboxImg.src = item.src;
                lightboxImg.style.display = 'block';
            } else {
                lightboxImg.style.display = 'none';
                lightboxVideo.src = item.src;
                lightboxVideo.style.display = 'block';
                lightboxVideo.play();
            }
        }

        function buildThumbs() {
            lightboxThumbs.innerHTML = '';
            lbItems.forEach((item, i) => {
                if (item.type === 'img') {
                    const t = document.createElement('img');
                    t.src = item.src;
                    t.className = 'lightbox-thumb' + (i === lbIndex ? ' active' : '');
                    t.addEventListener('click', () => { lbIndex = i; renderLightbox(); });
                    lightboxThumbs.appendChild(t);
                } else {
                    const t = document.createElement('div');
                    t.className = 'lightbox-thumb-video' + (i === lbIndex ? ' active' : '');
                    t.innerHTML = '▶';
                    t.addEventListener('click', () => { lbIndex = i; renderLightbox(); });
                    lightboxThumbs.appendChild(t);
                }
            });
        }

        function lbPrev() { lbIndex = (lbIndex - 1 + lbItems.length) % lbItems.length; renderLightbox(); }
        function lbNext() { lbIndex = (lbIndex + 1) % lbItems.length; renderLightbox(); }

        document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
        document.getElementById('lightboxPrev').addEventListener('click', lbPrev);
        document.getElementById('lightboxNext').addEventListener('click', lbNext);
        lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
        document.addEventListener('keydown', e => {
            if (!lightbox.classList.contains('open')) return;
            if (e.key === 'ArrowLeft')  lbPrev();
            if (e.key === 'ArrowRight') lbNext();
            if (e.key === 'Escape')     closeLightbox();
        });