// Interactive Showcase, Soundboard & Lightbox Script for Axis SFX Lab
document.addEventListener('DOMContentLoaded', () => {
  // Screenshot showcase tabs
  const tabs = document.querySelectorAll('.showcase-tab');
  const showcaseImage = document.getElementById('showcaseImage');
  const showcaseCaption = document.getElementById('showcaseCaption');
  const btnZoom = document.getElementById('btnZoom');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');

  // Platform Tab Switching (Windows / macOS / Linux)
  const platformTabs = document.querySelectorAll('.platform-tab');
  const platformPanels = document.querySelectorAll('.platform-panel');

  const switchPlatform = (platform) => {
    platformTabs.forEach(t => {
      const isMatch = t.getAttribute('data-platform') === platform;
      t.classList.toggle('active', isMatch);
      t.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    platformPanels.forEach(p => {
      p.classList.toggle('active', p.id === `panel-${platform}`);
    });
  };

  platformTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const platform = tab.getAttribute('data-platform');
      switchPlatform(platform);
    });
  });

  // OS Auto-Detection
  const ua = (navigator.userAgent || navigator.platform || '').toLowerCase();
  if (ua.includes('mac') || ua.includes('darwin')) {
    switchPlatform('macos');
  } else if (ua.includes('linux') && !ua.includes('android')) {
    switchPlatform('linux');
  } else {
    switchPlatform('windows');
  }

  // Tab switching for screenshots
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const newSrc = tab.getAttribute('data-img');
      const newDesc = tab.getAttribute('data-desc');

      if (showcaseImage) {
        showcaseImage.style.opacity = '0';
        setTimeout(() => {
          showcaseImage.src = newSrc;
          if (showcaseCaption) showcaseCaption.textContent = newDesc;
          showcaseImage.style.opacity = '1';
        }, 150);
      }
    });
  });

  // Lightbox
  const openLightbox = () => {
    if (lightboxImg && showcaseImage && lightboxModal) {
      lightboxImg.src = showcaseImage.src;
      lightboxModal.classList.add('active');
    }
  };

  const closeLightbox = () => {
    if (lightboxModal) lightboxModal.classList.remove('active');
  };

  btnZoom?.addEventListener('click', openLightbox);
  showcaseImage?.addEventListener('click', openLightbox);
  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxBackdrop?.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('active')) {
      closeLightbox();
    }
  });

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Interactive Soundboard Player
  let currentAudio = null;
  let currentPlayingBtn = null;

  const soundPills = document.querySelectorAll('.sound-pad-btn');
  soundPills.forEach(btn => {
    btn.addEventListener('click', () => {
      const soundSrc = btn.getAttribute('data-sound');
      if (!soundSrc) return;

      // If already playing this sound, stop it
      if (currentAudio && !currentAudio.paused && currentPlayingBtn === btn) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        btn.classList.remove('playing');
        currentPlayingBtn = null;
        return;
      }

      // Stop previous audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentPlayingBtn) currentPlayingBtn.classList.remove('playing');
      }

      const audio = new Audio(soundSrc);
      currentAudio = audio;
      currentPlayingBtn = btn;
      btn.classList.add('playing');

      audio.play().catch(e => {
        console.warn('Audio playback error:', e);
        btn.classList.remove('playing');
      });

      audio.addEventListener('ended', () => {
        btn.classList.remove('playing');
        if (currentPlayingBtn === btn) currentPlayingBtn = null;
      });
    });
  });
});
