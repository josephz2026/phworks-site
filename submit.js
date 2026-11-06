/* Shared form handler for PH Works. Sends a form (and any files) to the Supabase
   function, which saves it and emails the office. Change ENDPOINT here if it ever moves. */
(function () {
  var ENDPOINT = 'https://gycuakdoskxmmdjoyqxw.supabase.co/functions/v1/clever-function';
  var PHONE = '(718) 414-1083';

  /* Shrinks a photo to max 1600px JPEG so it sends fast on a phone connection.
     Anything that is not an image (or fails to load) is sent as is. */
  window.PHShrink = function (file) {
    return new Promise(function (ok) {
      if (!/^image\//.test(file.type)) return ok(file);
      var im = new Image(), u = URL.createObjectURL(file);
      im.onload = function () {
        var m = 1600, r = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        c.toBlob(function (b) {
          URL.revokeObjectURL(u);
          ok(b ? new File([b], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) : file);
        }, 'image/jpeg', 0.8);
      };
      im.onerror = function () { URL.revokeObjectURL(u); ok(file); };
      im.src = u;
    });
  };

  window.PHSubmit = function (opts) {
    var f = opts.form;
    var btn = f.querySelector('button[type="submit"]');
    var btnText = btn.textContent;
    var busy = false;

    var msg = document.createElement('p');
    msg.className = 'note';
    msg.setAttribute('role', 'alert');
    msg.style.cssText = 'color:#c0392b;font-weight:600;display:none';
    btn.parentNode.insertBefore(msg, btn.nextSibling);

    function reset() {
      busy = false;
      btn.disabled = false;
      btn.textContent = btnText;
    }
    function fail(text) {
      reset();
      msg.textContent = text;
      msg.style.display = 'block';
    }
    window.addEventListener('pageshow', function (e) { if (e.persisted) reset(); });

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      busy = true;
      msg.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Sending...';

      var body = opts.build(f);
      Object.keys(body).forEach(function (k) {
        if (body[k] === '' || body[k] == null) delete body[k];
      });
      body.type = opts.type;
      body.website = f.elements.website ? f.elements.website.value : '';

      Promise.resolve(opts.files ? opts.files(f) : []).then(function (files) {
        var fd = new FormData();
        fd.append('data', JSON.stringify(body));
        (files || []).forEach(function (x) { fd.append('files', x, x.name); });
        return fetch(ENDPOINT, { method: 'POST', body: fd });
      }).then(function (r) {
        if (r.ok) { window.location.href = 'thanks.html'; return; }
        return r.json().catch(function () { return {}; }).then(function (j) {
          var why = (r.status === 400 && j.error) ? j.error + ' ' : '';
          fail('Sorry, that did not send. ' + why + 'Please try again, or call us at ' + PHONE + '.');
        });
      }).catch(function () {
        fail('Sorry, that did not send. Please try again, or call us at ' + PHONE + '.');
      });
    });
  };
})();
