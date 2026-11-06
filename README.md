# Para ti, Dennis

A Spanish-language, mobile-first gift inspired by the Pirate Cove security feed in the first *Five Nights at Freddy’s*. It runs locally with plain HTML, CSS, and JavaScript.

## Open the gift

Open [index.html](index.html) in a modern browser. Keep the HTML, CSS, JavaScript, and `assets/` folder together. The gift needs no install, build step, or internet connection.

To preview over HTTP, run this from the project directory and open [localhost:8000](http://localhost:8000).

```sh
python3 -m http.server --bind 127.0.0.1 8000
```

## Controls

- Tap the box to open it. Drag the box to rotate it.
- Tap the note or the recessed interior to read it. Tap the lid or frame to close the box.
- Tap **CÁM. 1C** to recenter the box. The camera frame briefly lights up green.
- Swipe across the note cards or use the arrows. The timer is the first card.
- Tap **Sintonizar otro mensaje** to cycle through the private transmissions.
- With a keyboard, tab to the gift and press **Enter** or **Space** to open the box or read its note. **Escape** closes the note, then the box. Use **Left** and **Right** to change cards.

## Edit the gift

| File | What to edit |
| --- | --- |
| [index.html](index.html) | The dedication, the messages in `.transmission-messages`, and the cards in `.reasons`. |
| [gift-box.css](gift-box.css) | The camera interface, 3D geometry, materials, typography, and motion. |
| [gift-box.js](gift-box.js) | Touch and keyboard interactions, camera reset, carousel navigation, and clocks. |
| `assets/` | Locally bundled artwork, textures, and the VT323 font. |

To change the starting date, update the visible label, the timer’s accessible label, and the `datetime` value on `#timer-start` in [index.html](index.html). Include the UTC offset for that date and location. The London clock follows UK daylight saving. The header's night number and the note's days both count completed 24-hour periods from the same start instant.

## Credits

Unofficial fan gift. The [Pirate Cove screenshot](https://cliqist.com/2014/09/21/the-ultimate-five-nights-at-freddys-guide/) and [Foxy film still](https://www.slashfilm.com/1438575/five-nights-at-freddys-second-weekend-box-office-drop/) are credited on the page. The Foxy lid illustration and material textures were generated for the gift. [VT323](https://github.com/google/fonts/tree/main/ofl/vt323) is included under the [SIL Open Font License](assets/vt323-OFL.txt).

Made with ❤️ by Smith
