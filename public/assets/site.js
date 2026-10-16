(function () {
    var API = 'https://api.kiranrao.ai/api/dia-fund/giving-total';
    // Every.org Partner Webhook token (from every.org/developer). Public by design:
    // it rides on the donate link so Every.org notifies our webhook.
    var WEBHOOK_TOKEN = '30394c89ea62';

    // Donate links: carry utm_source through to the webhook via partner_metadata.
    var utm = new URLSearchParams(window.location.search).get('utm_source') || 'website';
    document.querySelectorAll('[data-every-org-slug]').forEach(function (a) {
        var params = new URLSearchParams();
        params.set('partner_metadata', btoa(JSON.stringify({ utm_source: utm, charity: a.dataset.charity })));
        params.set('success_url', 'https://thediafund.org/?thanks=1#donate');
        if (WEBHOOK_TOKEN) params.set('webhook_token', WEBHOOK_TOKEN);
        a.href = 'https://www.every.org/' + a.dataset.everyOrgSlug + '?' + params.toString() + '#donate';
    });

    // "Say hi" form -> Fenix. Sent as text/plain so it's a simple (no-preflight) request.
    var form = document.getElementById('hello-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var status = form.querySelector('.hello-status');
            var button = form.querySelector('button');
            var f = new FormData(form);
            var note = { name: f.get('name').trim(), email: f.get('email').trim(), message: f.get('message').trim(), website: f.get('website') };
            status.className = 'hello-status';
            if (!note.name || !note.email || note.message.length < 10) {
                status.textContent = 'Please add your name, email, and a short message.';
                status.className = 'hello-status err';
                return;
            }
            button.disabled = true;
            status.textContent = 'Sending…';
            fetch('https://api.kiranrao.ai/api/dia-fund/hello', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(note)
            })
                .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
                .then(function (r) {
                    if (!r.ok || !r.d.ok) { var e = new Error(r.d.error || ''); e.fromServer = true; throw e; }
                    form.reset();
                    status.textContent = 'Thank you! Your note is on its way to us.';
                    status.className = 'hello-status ok';
                })
                .catch(function (err) {
                    status.textContent = (err.fromServer && err.message) || 'Something went wrong. Please try again in a bit.';
                    status.className = 'hello-status err';
                })
                .then(function () { button.disabled = false; });
        });
    }

    // Running total from the Fenix ledger (Every.org webhook -> Supabase).
    var el = document.querySelector('[data-giving-total]');
    if (!el) return;
    fetch(API)
        .then(function (res) {
            if (!res.ok) throw new Error('not available');
            return res.json();
        })
        .then(function (data) {
            var total = Number(data.total_cents) / 100;
            el.textContent = '$' + total.toLocaleString('en-US', { maximumFractionDigits: 0 });
        })
        .catch(function () {
            el.parentNode.style.display = 'none';
        });
})();
