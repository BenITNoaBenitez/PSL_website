/* ========================================
   PSL.fr — Main JavaScript
   Scroll animations, mobile menu, header
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {

  // ─── Scroll Reveal Animations ───
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Optionnel : arrêter d'observer après affichage
        // revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(function (el) {
    revealObserver.observe(el);
  });


  // ─── Header Scroll Effect ───
  var header = document.getElementById('header');
  var lastScrollY = 0;

  function handleHeaderScroll() {
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();


  // ─── Mobile Menu Toggle ───
  var mobileToggle = document.getElementById('mobileToggle');
  var navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', function () {
      mobileToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click
    var navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }


  // ─── Back to Top Button ───
  var backToTop = document.getElementById('backToTop');

  function handleBackToTop() {
    if (!backToTop) return;
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', handleBackToTop, { passive: true });
  handleBackToTop();


  // ─── Smooth scroll for anchor links ───
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var headerOffset = 100;
        var elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
        var offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });


  // ─── Active nav link on scroll ───
  var sections = document.querySelectorAll('section[id]');
  var navLinksAll = document.querySelectorAll('.nav-link');

  function updateActiveNav() {
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;

    sections.forEach(function (section) {
      var sectionTop = section.offsetTop - 150;
      var sectionHeight = section.offsetHeight;
      var sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinksAll.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });


  // ─── Animated counter (for stats) ───
  var counters = document.querySelectorAll('.stat-number');
  var countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;

    counters.forEach(function (counter) {
      var text = counter.textContent;
      var match = text.match(/^(\d+)/);
      if (!match) return;

      var target = parseInt(match[1]);
      var suffix = text.replace(match[1], '');
      var duration = 2000;
      var start = 0;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        // Easing
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.floor(eased * target);
        counter.innerHTML = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          counter.innerHTML = target + suffix;
        }
      }

      requestAnimationFrame(step);
    });

    countersAnimated = true;
  }

  // Observe stats section
  var statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounters();
        }
      });
    }, { threshold: 0.3 });

    statsObserver.observe(statsSection);
  }


  // ─── Form submit (homepage & inner pages sans handler inline) ───
  var devisForm = document.getElementById('devisForm');
  if (devisForm && !devisForm.dataset.handled) {
    devisForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = devisForm.querySelector('button[type="submit"]');
      var origText = btn.innerHTML;
      btn.innerHTML = 'Demande envoyée &mdash; merci !';
      btn.style.background = '#2d8a4e';
      btn.style.borderColor = '#2d8a4e';
      btn.disabled = true;
      setTimeout(function () {
        devisForm.reset();
        btn.innerHTML = origText;
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.disabled = false;
      }, 4000);
    });
  }


  // ─── Parallax effect on hero (subtle) ───
  var heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && window.innerWidth > 1024) {
    window.addEventListener('scroll', function () {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollY < 800) {
        heroVisual.style.transform = 'translateY(' + (scrollY * 0.15) + 'px)';
      }
    }, { passive: true });
  }

});
