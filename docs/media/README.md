# TravelAI product media

Screenshots and demo GIF used in the root [README](../../README.md).

Captured from the local compose stack (`docker-compose.local.yml` ports `53000+`).

| File | Description |
|------|-------------|
| `demo-walkthrough.gif` | Home → hotels → gallery → tours → admin |
| `01-home.png` | Home (promos + catalog stats) |
| `02-hotels.png` | Hotels list + pagination |
| `03-hotel-gallery.png` | Multi-slide hotel gallery |
| `04-tours.png` | Tours catalog |
| `05-explore.png` | Explore destinations |
| `06-chatbot.png` | Global chatbot FAB open |
| `07-admin.png` | Admin reindex console |
| `08-ai-planner.png` | AI planner page |
| `09-mobile-home.png` | Mobile home (~390px) |
| `10-mobile-gallery.png` | Mobile hotel gallery |

Regenerate (requires stack up + Playwright in `e2e/`):

```bash
# See scripts or re-run the capture flow from the agent session
ffmpeg -y -framerate 0.7 -start_number 1 -i frames/f%02d.png -vf scale=960:-1 docs/media/demo-walkthrough.gif
```
