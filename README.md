# This Portfolio Is In Production

The personal portfolio of Soham Deshmukh, built for the AWS portfolio hackathon and hosted on AWS Amplify Hosting.

It looks like a calm portfolio, and it behaves like a production system. Flip the guarded **Chaos Test** switch in the hero and the site has a simulated outage. You get paged, fix three incidents, and bring the page back.

## The three incidents

| Incident | Task | Based on |
|---|---|---|
| One bad config | Find the section over the proxy's row limit and roll it back | My post on the Cloudflare outage |
| The region went dark | Shift traffic to the standby that can still reach its database | My post on the 15-hour AWS outage |
| The leak you can't see | Find the junction where water in and out don't match, then wait for three clean readings | My project LeakSpot |

The outage is visual only. Content stays readable, navigation keeps working, and `Skip and restore site` or Esc restores everything at any time.

## Built with

Plain HTML, CSS and JavaScript. No frameworks, packages, build step or backend. The animations use Canvas, SVG and CSS, and sound is generated with the Web Audio API.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8123
```

## Deployment

AWS Amplify Hosting deploys the `main` branch on every push, with an empty build command and `/` as the output directory.
