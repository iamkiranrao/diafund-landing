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
