/* ============================================================
   LUMINE THEME — JavaScript by Bayane
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* === CART DRAWER === */
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartToggle = document.querySelector('.cart-toggle');
  const cartClose = document.getElementById('cart-close');

  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('active');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('active');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (cartToggle) cartToggle.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCart();
  });

  /* === ADD TO CART (AJAX) === */
  async function addToCart(variantId, quantity = 1) {
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity })
      });

      if (!response.ok) throw new Error('Add to cart failed');

      await refreshCart();
      openCart();
    } catch (err) {
      console.error('Add to cart error:', err);
    }
  }

  /* === REFRESH CART CONTENTS === */
  async function refreshCart() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();

      updateCartCount(cart.item_count);
      await refreshCartDrawer();
    } catch (err) {
      console.error('Cart refresh error:', err);
    }
  }

  async function refreshCartDrawer() {
    try {
      const response = await fetch('/?section_id=cart-drawer-section');
      if (!response.ok) return;
      // Update cart items via section rendering if available
    } catch (err) {
      // Fallback: update count only
    }
  }

  function updateCartCount(count) {
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
    });
    document.querySelectorAll('.cart-count-label').forEach(el => {
      el.textContent = '(' + count + ')';
    });
  }

  /* === QUICK ADD BUTTONS === */
  document.querySelectorAll('.btn-quick-add').forEach(btn => {
    btn.addEventListener('click', function () {
      const variantId = this.dataset.productId;
      if (!variantId) return;

      const originalText = this.textContent;
      this.textContent = 'Adding...';
      this.disabled = true;

      addToCart(variantId).finally(() => {
        this.textContent = 'Added!';
        setTimeout(() => {
          this.textContent = originalText;
          this.disabled = false;
        }, 1500);
      });
    });
  });

  /* === PRODUCT FORM ADD TO CART === */
  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const variantId = document.getElementById('variant-id').value;
      const btn = document.getElementById('add-to-cart');
      const originalText = btn.textContent;

      btn.textContent = 'Adding...';
      btn.disabled = true;

      addToCart(variantId).finally(() => {
        btn.textContent = 'Added!';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 1500);
      });
    });
  }

  /* === VARIANT SELECTOR === */
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const position = this.dataset.optionPosition;
      const value = this.dataset.value;

      // Deselect siblings
      document.querySelectorAll(`.option-btn[data-option-position="${position}"]`).forEach(b => {
        b.classList.remove('active');
      });
      this.classList.add('active');

      updateSelectedVariant();
    });
  });

  function updateSelectedVariant() {
    const selectedValues = [];
    document.querySelectorAll('.option-btn.active').forEach(btn => {
      selectedValues[parseInt(btn.dataset.optionPosition) - 1] = btn.dataset.value;
    });

    if (typeof window.productVariants !== 'undefined') {
      const matched = window.productVariants.find(v =>
        v.options.every((opt, i) => opt === selectedValues[i])
      );

      if (matched) {
        const variantInput = document.getElementById('variant-id');
        if (variantInput) variantInput.value = matched.id;

        const addBtn = document.getElementById('add-to-cart');
        if (addBtn) {
          addBtn.textContent = matched.available ? 'Add to Cart' : 'Sold Out';
          addBtn.disabled = !matched.available;
        }
      }
    }
  }

  /* === CART ITEM REMOVE === */
  document.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', async function () {
      const key = this.dataset.key;
      await updateCartItem(key, 0);
    });
  });

  /* === CART QTY BUTTONS === */
  document.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', async function () {
      const key = this.dataset.key;
      const qtyEl = this.parentElement.querySelector('span');
      const current = parseInt(qtyEl.textContent);
      if (current > 1) await updateCartItem(key, current - 1);
      else await updateCartItem(key, 0);
    });
  });

  document.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', async function () {
      const key = this.dataset.key;
      const qtyEl = this.parentElement.querySelector('span');
      const current = parseInt(qtyEl.textContent);
      await updateCartItem(key, current + 1);
    });
  });

  async function updateCartItem(key, quantity) {
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });
      const cart = await response.json();
      updateCartCount(cart.item_count);
      // Reload page to refresh cart drawer contents
      window.location.reload();
    } catch (err) {
      console.error('Cart update error:', err);
    }
  }

});
