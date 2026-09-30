# Slevin Gardner’s Website

A personal portfolio and project hub for Slevin Gardner. It shares what I’m learning, what I’m working on, and a few interactive projects made while exploring web development.

## What’s on the site

- **About:** A little about me and why I like building things for the web.
- **Now:** What I’m learning and spending time on lately.
- **Work:** Project cards, including the **Silent Fleet** Battleship-style game.
- **Seven visual themes:** Metal Gear, Black Mesa, Portal, Redtail Catfish, Half-Life 2, Squad, and Voices of the Void. The selected theme is remembered in the browser.
- **Music button:** Plays a theme-related track in supported themes. Music comes from YouTube and starts only when the button is pressed.
- **Animated backgrounds:** Visual effects change with the selected theme.

Use the jump links or the navigation at the top of the page to move between sections.

## Silent Fleet

[Open Silent Fleet](assignments/01-this-is-me/battleship.html)

Place a fleet on an 8 × 8 grid, then search the enemy waters. Ships can face horizontally or vertically and cannot overlap. Each side fires up to four shots per turn. The game shows your fleet, animated ocean water, and fire and hull damage at enemy ship locations you hit. Enemy ships remain hidden until you hit them.

The ship illustrations are original SVGs inspired by [CraftPix’s free military boat pack](https://craftpix.net/freebies/free-top-down-military-boats-pixel-art/).

## Other projects and learning materials

- **Stormworks Lua Field Guide** ([open the guide](stormworks-lua.html)): A beginner-to-advanced walkthrough of Lua microcontrollers, inputs and outputs, monitor drawing, and debugging in Stormworks: Build and Rescue.
- **The Vault** (game/): A Python text adventure. See [its README](game/README.md) for how to play and change it.
- **Day 24** (day-24/): A flexbox lesson and starter files.
- **Week 08** (week-08/): JavaScript lessons and a small interactive website project.

These exercises live alongside the portfolio, but they are not sections of the main landing page.

## Run the website locally

This is a static site made with HTML, CSS, and JavaScript; there are no packages to install. From the project folder, start a local server:

~~~sh
python3 -m http.server 8000
~~~

Then open [http://localhost:8000](http://localhost:8000). To play Silent Fleet, open [http://localhost:8000/assignments/01-this-is-me/battleship.html](http://localhost:8000/assignments/01-this-is-me/battleship.html).

## Publish with GitHub Pages

In the repository’s **Settings → Pages**, choose **Deploy from a branch**, select the **main** branch and the **/(root)** folder, then save. GitHub Pages will publish the site from the root index.html; new commits update the published site.
