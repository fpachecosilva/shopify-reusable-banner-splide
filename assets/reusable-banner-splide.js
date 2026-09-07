(() => {
  class ReusableBannerSplide {
    constructor(root) {
      this.root = root;
      this.list = root.querySelector('.splide__list');
      this.allSlides = this.list ? Array.from(this.list.children) : [];
      this.controls = Array.from(root.querySelectorAll('[data-reusable-banner-control]'));
      this.previousButton = root.querySelector('[data-reusable-banner-previous]');
      this.nextButton = root.querySelector('[data-reusable-banner-next]');
      this.autoplayButton = root.querySelector('[data-reusable-banner-autoplay]');
      this.currentElement = root.querySelector('[data-reusable-banner-current]');
      this.totalElement = root.querySelector('[data-reusable-banner-total]');
      this.manualPause = false;
      this.splide = null;
      this.bindControls();
      this.applyScheduleVisibility();
      this.scheduleVisibilityRefresh();
    }

    bindControls() {
      this.previousButton?.addEventListener('click', () => this.splide?.go('<'));
      this.nextButton?.addEventListener('click', () => this.splide?.go('>'));
      this.autoplayButton?.addEventListener('click', () => this.toggleAutoplay());
      this.controls.forEach((control) => {
        control.addEventListener('click', () => {
          const activeIndex = this.activeSlides.findIndex(
            (slide) => slide.dataset.slideIndex === control.dataset.slideIndex
          );
          if (activeIndex >= 0) this.splide?.go(activeIndex);
        });
      });
    }

    applyScheduleVisibility() {
      const now = this.getScheduleNow();
      const previousSignature = (this.activeSlides || []).map((slide) => slide.id).join(',');
      this.activeSlides = this.allSlides.filter((slide) => this.isSlideActive(slide, now));
      const nextSignature = this.activeSlides.map((slide) => slide.id).join(',');

      this.allSlides.forEach((slide) => {
        const active = this.activeSlides.includes(slide);
        slide.hidden = !active;
        this.controls
          .filter((control) => control.dataset.slideIndex === slide.dataset.slideIndex)
          .forEach((control) => {
            control.hidden = !active;
          });
      });

      if (!this.activeSlides.length) {
        this.root.hidden = true;
        this.destroySplide();
        return;
      }

      this.root.hidden = false;
      if (!this.splide || previousSignature !== nextSignature) {
        this.mountSplide();
      } else {
        this.updateStatus();
      }
    }

    isSlideActive(slide, now) {
      if (slide.dataset.recurringEnabled === 'true') return this.isRecurringActive(slide, now);
      if (slide.dataset.scheduleEnabled === 'true') return this.isOneTimeActive(slide, now);
      return true;
    }

    mountSplide() {
      if (!window.Splide || !this.list) return;
      this.destroySplide();
      this.list.replaceChildren(...this.activeSlides);
      this.activeSlides.forEach((slide) => {
        slide.hidden = false;
      });

      const isFade = this.root.dataset.splideTransition === 'fade';
      const isLoop = this.root.dataset.loop === 'true';
      const shouldAutoplay = this.root.dataset.autoRotate === 'true' && this.activeSlides.length > 1;
      const options = {
        type: isFade ? 'fade' : isLoop ? 'loop' : 'slide',
        rewind: false,
        perPage: 1,
        perMove: 1,
        gap: 0,
        arrows: false,
        pagination: false,
        autoplay: shouldAutoplay,
        interval: Number(this.root.dataset.speed) || 5000,
        pauseOnHover: this.root.dataset.pauseOnHover === 'true',
        pauseOnFocus: this.root.dataset.pauseOnFocus === 'true',
        keyboard: 'focused',
        drag: this.activeSlides.length > 1,
        reducedMotion: {
          autoplay: 'pause',
          speed: 0,
        },
        i18n: {
          prev: 'Slide anterior',
          next: 'Próximo slide',
          first: 'Ir para o primeiro slide',
          last: 'Ir para o último slide',
          slideX: 'Ir para o slide %s',
          pageX: 'Ir para a página %s',
          play: 'Reproduzir carrossel',
          pause: 'Pausar carrossel',
          carousel: 'Carrossel',
        },
      };

      this.splide = new window.Splide(this.root, options);
      this.splide.on('mounted moved', () => this.updateStatus());
      this.splide.mount();
      this.manualPause = false;
      this.updateAutoplayButton();
    }

    destroySplide() {
      if (this.splide) {
        this.splide.destroy(true);
        this.splide = null;
      }
      if (this.list) this.list.replaceChildren();
    }

    updateStatus() {
      if (!this.splide || !this.activeSlides.length) return;
      const currentIndex = this.splide.index;
      const currentSlide = this.activeSlides[currentIndex];
      this.currentElement && (this.currentElement.textContent = currentIndex + 1);
      this.totalElement && (this.totalElement.textContent = this.activeSlides.length);
      this.activeSlides.forEach((slide, index) => {
        slide.setAttribute('aria-label', `${index + 1} de ${this.activeSlides.length}`);
        const active = index === currentIndex;
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        slide.querySelectorAll('a, button').forEach((element) => {
          if (active) element.removeAttribute('tabindex');
          else element.setAttribute('tabindex', '-1');
        });
      });
      this.controls.forEach((control) => {
        const active = currentSlide && control.dataset.slideIndex === currentSlide.dataset.slideIndex;
        control.classList.toggle('is-active', active);
        control.setAttribute('aria-current', active ? 'true' : 'false');
      });
      if (this.previousButton) this.previousButton.disabled = this.root.dataset.loop !== 'true' && currentIndex === 0;
      if (this.nextButton) this.nextButton.disabled = this.root.dataset.loop !== 'true' && currentIndex === this.activeSlides.length - 1;
    }

    toggleAutoplay() {
      if (!this.splide?.Components.Autoplay) return;
      this.manualPause = !this.manualPause;
      if (this.manualPause) this.splide.Components.Autoplay.pause();
      else this.splide.Components.Autoplay.play();
      this.updateAutoplayButton();
    }

    updateAutoplayButton() {
      if (!this.autoplayButton) return;
      const autoplay = this.splide?.Components.Autoplay;
      const isPlaying = Boolean(autoplay) && !autoplay.isPaused() && !this.manualPause;
      const label = isPlaying ? this.autoplayButton.dataset.labelPause : this.autoplayButton.dataset.labelPlay;
      this.autoplayButton.setAttribute('aria-label', label);
      this.autoplayButton.querySelector('[data-reusable-banner-pause-icon]')?.toggleAttribute('hidden', !isPlaying);
      this.autoplayButton.querySelector('[data-reusable-banner-play-icon]')?.toggleAttribute('hidden', isPlaying);
      const text = this.autoplayButton.querySelector('[data-reusable-banner-autoplay-label]');
      if (text) text.textContent = label;
    }

    scheduleVisibilityRefresh() {
      if (!this.allSlides.some((slide) => slide.dataset.scheduleEnabled === 'true' || slide.dataset.recurringEnabled === 'true')) return;
      if (this.root.dataset.scheduleTestNow) return;
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = setTimeout(() => {
        this.applyScheduleVisibility();
        this.scheduleVisibilityRefresh();
      }, 60050 - (Date.now() % 60000));
    }

    getScheduleNow() {
      if (this.root.dataset.scheduleTestNow) return this.parseScheduleDate(this.root.dataset.scheduleTestNow);
      const timeZone = this.root.dataset.scheduleTimeZone || 'America/Sao_Paulo';
      try {
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).formatToParts(new Date());
        const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
        return this.buildScheduleDate(Number(values.year), Number(values.month), Number(values.day), Number(values.hour), Number(values.minute));
      } catch (error) {
        const now = new Date();
        return this.buildScheduleDate(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes());
      }
    }

    parseScheduleDate(value) {
      const match = value?.trim().match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/);
      if (!match) return null;
      const [, day, month, year, hour, minute] = match.map(Number);
      return this.buildScheduleDate(year, month, day, hour, minute);
    }

    buildScheduleDate(year, month, day, hour, minute) {
      const validationDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
      const isValid = validationDate.getUTCFullYear() === year && validationDate.getUTCMonth() === month - 1 && validationDate.getUTCDate() === day && validationDate.getUTCHours() === hour && validationDate.getUTCMinutes() === minute;
      if (!isValid) return null;
      return {
        key: year * 100000000 + month * 1000000 + day * 10000 + hour * 100 + minute,
        weekday: validationDate.getUTCDay(),
        minutes: hour * 60 + minute,
      };
    }

    parseScheduleTime(value) {
      const match = value?.trim().match(/^(\d{2}):(\d{2})$/);
      if (!match) return null;
      const hour = Number(match[1]);
      const minute = Number(match[2]);
      return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
    }

    isOneTimeActive(slide, now) {
      const start = this.parseScheduleDate(slide.dataset.scheduleStart);
      const endValue = slide.dataset.scheduleEnd?.trim();
      const end = endValue ? this.parseScheduleDate(endValue) : null;
      if (!now || !start || (endValue && !end) || (end && end.key <= start.key)) return false;
      return now.key >= start.key && (!end || now.key < end.key);
    }

    isRecurringActive(slide, now) {
      const weekdays = new Set((slide.dataset.recurringDays || '').split(',').filter(Boolean).map(Number).filter((day) => day >= 0 && day <= 6));
      const startTime = this.parseScheduleTime(slide.dataset.recurringStartTime);
      const endTime = this.parseScheduleTime(slide.dataset.recurringEndTime);
      const campaignStartValue = slide.dataset.recurringStartAt?.trim();
      const campaignEndValue = slide.dataset.recurringEndAt?.trim();
      const campaignStart = campaignStartValue ? this.parseScheduleDate(campaignStartValue) : null;
      const campaignEnd = campaignEndValue ? this.parseScheduleDate(campaignEndValue) : null;
      if (!now || !weekdays.size || startTime === null || endTime === null || (campaignStartValue && !campaignStart) || (campaignEndValue && !campaignEnd) || (campaignStart && campaignEnd && campaignEnd.key <= campaignStart.key)) return false;
      if (campaignStart && now.key < campaignStart.key) return false;
      if (campaignEnd && now.key >= campaignEnd.key) return false;
      if (startTime === endTime) return weekdays.has(now.weekday);
      if (startTime < endTime) return weekdays.has(now.weekday) && now.minutes >= startTime && now.minutes < endTime;
      const previousWeekday = (now.weekday + 6) % 7;
      return (weekdays.has(now.weekday) && now.minutes >= startTime) || (weekdays.has(previousWeekday) && now.minutes < endTime);
    }

    destroy() {
      clearTimeout(this.scheduleTimer);
      this.destroySplide();
    }
  }

  function mountBanners(scope = document) {
    if (!window.Splide) return;
    scope.querySelectorAll('[data-reusable-banner-splide]').forEach((root) => {
      if (!root._reusableBannerSplide) root._reusableBannerSplide = new ReusableBannerSplide(root);
    });
  }

  function destroyBanners(scope) {
    scope.querySelectorAll('[data-reusable-banner-splide]').forEach((root) => {
      root._reusableBannerSplide?.destroy();
      delete root._reusableBannerSplide;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountBanners());
  else mountBanners();
  document.addEventListener('shopify:section:load', (event) => mountBanners(event.target));
  document.addEventListener('shopify:section:unload', (event) => destroyBanners(event.target));
})();
