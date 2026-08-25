(function () {
  function initContactModal() {
    let modal = document.querySelector('#contact-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'contact-modal';
      modal.id = 'contact-modal';
      modal.hidden = true;
      modal.innerHTML = '<div class="modal-backdrop" data-contact-close></div><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="contact-title"><button class="modal-close" type="button" aria-label="Close" data-contact-close>×</button><span class="eyebrow">Get in touch</span><h2 id="contact-title">Contact us</h2><p>We would be happy to help with product details, sourcing and appointments.</p><form class="contact-form" id="contact-form"><label>Name<input name="name" required maxlength="100" autocomplete="name"></label><label>Email<input name="email" type="email" required maxlength="200" autocomplete="email"></label><label>WhatsApp (optional)<input name="whatsapp" maxlength="40" autocomplete="tel"></label><label>Message<textarea name="message" required minlength="10" maxlength="4000" rows="5"></textarea></label><input class="contact-honeypot" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="contact-status" id="contact-status" role="status" aria-live="polite"></p><button class="contact-submit" type="submit">Send message</button></form></section>';
      document.body.appendChild(modal);
    }
    const close = () => { modal.hidden = true; };
    document.querySelectorAll('.contact-trigger').forEach((trigger) => {
      if (trigger.dataset.contactBound) return;
      trigger.dataset.contactBound = 'true';
      trigger.addEventListener('click', () => { modal.hidden = false; });
    });
    modal.querySelectorAll('[data-contact-close], .modal-close').forEach((button) => {
      if (button.dataset.contactBound) return;
      button.dataset.contactBound = 'true';
      button.addEventListener('click', close);
    });
    if (!document.body.dataset.contactEscapeBound) {
      document.body.dataset.contactEscapeBound = 'true';
      document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initContactModal);
  else initContactModal();
})();
