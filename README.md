# AIYR Coffee Dorohoi

Site-ul AIYR Coffee Dorohoi, adaptat din șablonul de cafenea. [Deschide site-ul pe GitHub Pages](https://cojocariuemilian73.github.io/aiyr-coffee-dorohoi/).

- Deschide `index.html` pentru site și `meniu.html` pentru pagina de meniu.
- Editează `sursa/date-site.json` și rulează `python sursa/genereaza.py` pentru a actualiza paginile.
- Pune fotografiile cafenelei în `assets/img/aiyr/`, actualizează intrările din `imagini` și rulează `python sursa/optimizeaza_imagini.py`. Înlocuiește sigla provizorie din `favicon.png`. Actualizează `fotografiiIlustrative` și `surseFoto` după înlocuirea imaginii.
- Adaugă meniul și prețurile în `meniu`, programul și telefonul în `locatii`, iar profilele și adresele de contact în `linkuri`. Secțiunile de poveste, galerie și recenzii apar când primesc conținut.
- După stabilirea adresei publice, completează `publicUrl` înainte să generezi cartonașul pentru mese cu `python sursa/qr.py` și apoi `python sursa/genereaza.py`.

Adresa publică găsită este Strada Războieni 1, Dorohoi. [Intrarea din directorul Am Găsit](https://am-gasit.ro/aiyr-coffee-strada-razboieni-1-715200-dorohoi/).

Fotografia ilustrativă este de Nathan Dumlao. [Unsplash](https://unsplash.com/photos/zUNs99PGDg0).
