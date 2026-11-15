"""Propunerile pentru patron: voucher pe e-mail, roata norocului și specialitățile casei.

Apar pe demo.html. Pe index.html apar doar când "extra.activ" e true în date-site.json.
"""
import json
import math


def build(data, esc, image):
    extra = data["extra"]
    demo = extra.get("demo", False) or data.get("meniuExemplu", False)
    products = {p["nume"]: p for category in data["meniu"] for p in category["produse"]}

    def price(product):
        value = product["pret"]
        return (f"{value:g}".replace(".", ",") + " lei") if value is not None else "La cerere"

    spec = extra["specialitati"]
    cards = []
    for name in spec["produse"]:
        product = products.get(name)
        if not product:
            continue
        key = product.get("imagine")
        if key in data["imagini"]:
            photo = f'<div class="special-photo">{image(key, sizes="(min-width: 900px) 30vw, 80vw")}</div>'
        else:
            photo = f'<div class="special-photo is-type" aria-hidden="true"><span>{esc(product["nume"])}</span></div>'
        tint = spec.get("tente", {}).get(name, "#c08a5e")
        story = spec.get("povesti", {}).get(name, {})
        kicker = f'<span class="special-kicker">{esc(story["eticheta"])}</span>' if story.get("eticheta") else ""
        photo_note = '<span class="product-photo-note">Foto ilustrativă</span>' if data["imagini"].get(key, {}).get("ilustrativa") else ""
        detail = story.get("text") or product.get("descriere")
        detail_html = f'<p>{esc(detail)}</p>' if detail else ""
        cards.append(
            f'<li class="special" style="--tint-own:{esc(tint)}">'
            f'<div class="special-visual">{photo}</div>'
            f'<div class="special-copy">{kicker}<h3>{esc(product["nume"])}</h3>'
            f'{detail_html}<span class="price">{price(product)}</span>{photo_note}</div></li>'
        )
    specials = (
        '<section class="specials" id="specialitati" aria-labelledby="specials-title">'
        '<div class="shell specials-inner">'
        f'<div class="specials-head"><h2 id="specials-title">{esc(spec["titlu"])}</h2><p>{esc(spec["text"])}</p></div>'
        f'<ul class="special-list">{"".join(cards)}</ul></div></section>'
    ) if cards else ""

    # --- Roata: 12 felii (fiecare premiu de două ori, față în față), becuri, cuie, ac și butuc ---
    wheel = extra["roata"]
    prizes = wheel["premii"]
    n = len(prizes) * 2
    step = 360 / n
    C, R = 120, 100

    def point(radius, angle):
        rad = math.radians(angle - 90)
        return C + radius * math.cos(rad), C + radius * math.sin(rad)

    slices, pegs, lights = [], [], []
    for i in range(n):
        prize = prizes[i % len(prizes)]
        x0, y0 = point(R, i * step)
        x1, y1 = point(R, (i + 1) * step)
        mid = (i + .5) * step
        slices.append(
            f'<path class="slice s{i % 3}" data-slice="{i}" d="M{C} {C}L{x0:.2f} {y0:.2f}A{R} {R} 0 0 1 {x1:.2f} {y1:.2f}Z"/>'
            f'<text class="t{i % 3}" transform="rotate({mid:.1f} {C} {C}) translate({C} {C - R + 12}) rotate(90)" dominant-baseline="middle">{esc(prize["scurt"])}</text>'
        )
        px, py = point(R - 3, i * step)
        pegs.append(f'<circle class="peg" cx="{px:.2f}" cy="{py:.2f}" r="2.4"/>')
    for i in range(24):
        lx, ly = point(110, i * 15 + 7.5)
        lights.append(f'<circle class="bulb b{i % 2}" cx="{lx:.2f}" cy="{ly:.2f}" r="3.1"/>')
    wheel_svg = (
        '<svg class="wheel" viewBox="0 0 240 240" aria-hidden="true">'
        f'<circle class="wheel-frame" cx="{C}" cy="{C}" r="117"/>'
        f'<g class="wheel-lights">{"".join(lights)}</g>'
        f'<g class="wheel-disc">{"".join(slices)}'
        f'{"".join(pegs)}</g>'
        f'<circle class="wheel-edge" cx="{C}" cy="{C}" r="{R}"/>'
        f'<circle class="wheel-hub" cx="{C}" cy="{C}" r="25"/>'
        f'<text class="wheel-hub-text" x="{C}" y="{C + 1}" text-anchor="middle" dominant-baseline="middle">{esc(data["texte"]["logo"]["mare"])}</text>'
        '<g class="wheel-pointer"><path d="M120 30 L109 6 Q120 -2 131 6 Z"/><circle cx="120" cy="9" r="3.2"/></g>'
        '</svg>'
    )

    voucher = extra["voucher"]
    mail = extra.get("email", {})
    config = {
        "demo": demo,
        "prizes": [p["nume"] for p in prizes],
        "wheelValid": wheel["valabilitate"],
        "prefix": data["texte"]["logo"]["mare"],
        "supabaseUrl": "" if demo else mail.get("supabaseUrl", ""),
        "supabaseKey": "" if demo else mail.get("supabaseCheie", ""),
    }
    config_json = json.dumps(config, ensure_ascii=False).replace("<", "\\u003c")
    voucher_button = '<button type="button" class="button button-outline" data-voucher>Încearcă voucherul demo</button>' if demo else ""
    offers = (
        '<section class="section offers" id="oferte" aria-labelledby="offers-title"><div class="shell">'
        '<div class="offer-grid">'
        f'<article class="offer offer-wheel"><h3 id="offers-title">{esc(wheel["titlu"])}</h3><p>{esc(wheel["text"])}</p>'
        f'<button type="button" class="wheel-wrap" aria-label="Învârte roata">{wheel_svg}</button>'
        '<button type="button" class="button button-dark" data-spin>Învârte roata</button>'
        f'<p class="wheel-result" role="status"></p>{voucher_button}</article>'
        '</div></div>'
        f'<script id="extra-config" type="application/json">{config_json}</script>'
        '</section>'
    )

    # --- Fereastra cu voucherul: e-mail, cod de confirmare, voucher ---
    email_field = '<input id="welcome-email" type="email" value="demo@example.com" readonly>' if demo else '<input id="welcome-email" type="email" autocomplete="email" required placeholder="nume@exemplu.ro">'
    consent_field = "" if demo else f'<label class="welcome-consent"><input type="checkbox" required> <span>{esc(voucher["acord"])}</span></label>'
    request_label = "Generează codul de probă" if demo else "Trimite-mi codul"
    sent_message = '<p>Introdu codul afișat mai jos.</p>' if demo else '<p>Ți-am trimis un cod de 6 cifre la <strong class="welcome-to"></strong>. Scrie-l aici.</p>'
    voucher_message = '<p>Voucher demonstrativ. Codul este pentru prezentare.</p>' if demo else '<p>Gata! Arată voucherul la bar, la prima vizită.</p>'
    ticket_label = "Voucher espresso · demo" if demo else "Espresso din partea casei"
    voucher_shortcut = "Voucherul demo" if demo else "Voucherul tău ☕"
    voucher_image = voucher.get("imagine", "vEspresso")
    modal = (
        '<dialog class="welcome" aria-labelledby="welcome-title">'
        '<form method="dialog" class="welcome-close"><button aria-label="Închide">×</button></form>'
        f'<div class="welcome-photo" aria-hidden="true">{image(voucher_image, sizes="(min-width: 700px) 320px, 100vw")}</div>'
        '<div class="welcome-body">'
        f'<h2 id="welcome-title">{esc(voucher["titlu"])}</h2>'
        # Pasul 1: adresa de e-mail
        '<form class="welcome-step" data-step="email" novalidate>'
        f'<p>{esc(voucher["text"])}</p>'
        f'<label for="welcome-email">{"Adresă de test" if demo else "Adresa de e-mail"}</label>'
        f'{email_field}{consent_field}<button class="button button-dark">{request_label}</button>'
        '<p class="welcome-error" role="alert"></p></form>'
        # Pasul 2: codul primit
        '<form class="welcome-step" data-step="code" hidden novalidate>'
        f'{sent_message}'
        '<label for="welcome-code">Codul de confirmare</label>'
        '<input id="welcome-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required>'
        '<button class="button button-dark">Confirmă</button>'
        '<p class="welcome-demo" hidden></p>'
        f'<button type="button" class="welcome-back">{"Generează alt cod" if demo else "Altă adresă de e-mail"}</button>'
        '<p class="welcome-error" role="alert"></p></form>'
        # Pasul 3: voucherul
        '<div class="welcome-step" data-step="voucher" hidden>'
        f'{voucher_message}'
        '<div class="ticket"><div class="ticket-qr" aria-hidden="true"></div>'
        f'<div class="ticket-info"><span class="ticket-label">{ticket_label}</span>'
        '<strong class="ticket-code"></strong><span class="ticket-until"></span></div></div>'
        f'<small>{esc(voucher["conditii"])}</small></div>'
        '</div></dialog>'
        f'<button type="button" class="voucher-pill" hidden>{voucher_shortcut}</button>'
    )
    return {"offers": offers, "afterMenu": specials, "modal": modal}
