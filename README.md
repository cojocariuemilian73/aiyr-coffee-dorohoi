# AIYR Coffee Dorohoi

Site-ul AIYR Coffee Dorohoi, adaptat din șablonul de cafenea. [Deschide site-ul pe GitHub Pages](https://cojocariuemilian73.github.io/aiyr-coffee-dorohoi/).

- Deschide `index.html` pentru site și `meniu.html` pentru pagina de meniu.
- Editează `sursa/date-site.json` și rulează `python sursa/genereaza.py` pentru a actualiza paginile.
- Pune fotografiile cafenelei în `assets/img/aiyr/`, actualizează intrările din `imagini` și rulează `python sursa/optimizeaza_imagini.py`. Înlocuiește sigla provizorie din `favicon.png`. Actualizează `fotografiiIlustrative` și `surseFoto` după înlocuirea imaginii.
- Adaugă meniul și prețurile în `meniu`, programul și telefonul în `locatii`, iar profilele și adresele de contact în `linkuri`. Secțiunile de poveste, galerie și recenzii apar când primesc conținut.
- Pentru prezentare, produsele și prețurile din `meniu` sunt exemple. După ce le înlocuiești cu meniul aprobat de cafenea, setează `meniuExemplu` la `false` și regenerează paginile.
- Roata și voucherul au modul demo activat în `extra.demo`. Premiile și codurile sunt de probă. Voucherul folosește o adresă prestabilită și afișează codul direct pe pagină.
- Deschide `print/card-masa.html` pentru cartonașele cu QR către pagina de meniu.
- După stabilirea adresei publice, completează `publicUrl` înainte să generezi cartonașul pentru mese cu `python sursa/qr.py` și apoi `python sursa/genereaza.py`.

Adresa publică găsită este Strada Războieni 1, Dorohoi. [Intrarea din directorul Am Găsit](https://am-gasit.ro/aiyr-coffee-strada-razboieni-1-715200-dorohoi/).

Fotografiile fațadei, interiorului și produselor provin din galeria AIYR Coffee. Autorii sunt creditați în subsolul paginii. [Google Maps](https://www.google.com/maps/place/AIYR+Coffee/data=!4m7!3m6!1s0x47346100715c225f:0xb4c6591201c3e40e!8m2!3d47.9545741!4d26.3971855!16s%2Fg%2F11y_xgzvdb!19sChIJXyJccQBhNEcRDuTDARJZxrQ).
