## Project structure

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

The bulk of the code lives in `/src/components`. If you want to update a specific part of the app, you can find it by:

1. Inspect the element in the browser
1. I've named each element's `class` based on the BEM methodology. If you see a class that starts with a capital letter (eg. `Network__type-path`), the root of that string will be the name of the component it belongs to (`Network`)
1. Find the component with the same name in `/src/components`

The root of the app is in `src/components/App.js`. You can always trace the render logic from here to find when components are rendered.

Static files live in the `/public` folder, accessible at `/filename` within the app. For example, `data.json` is loadable at the url `/data.json`, which completes to `localhost:3000/data.json` when running locally.

## Development

1. Clone this repository onto your local machine.
1. install npm modules using `yarn`
1. run `yarn start` to start the server
1. open [http://localhost:3000](http://localhost:3000) to view it in the browser. Th eobjectives view is visible at [http://localhost:3000?viz=objectives](http://localhost:3000?viz=objectives)

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

## Deploying

To deploy to Github Pages, run:

```shell
npm run deploy
```

This will build the production bundle and push to the `gh-pages` branch, which is used to host the site.

## Updating data

I have a file named `.env.local` that sits in the base of this repository that contains my airtable API key.

```
AIRTABLE_API_KEY=XXX
```

When `yarn data` is run, it will run the node script `./getData.js`, which uses that API key to fetch data from Airtable and parse it.

The repo has an attached Github Action that can access that API key (pls don't steal it), runs `yarn data`, and commits any changes to the `data.json` file.

This Action will run whenever a change is pushed to `master`, and at midnight UTC every day. See past runs or re-run the Action [in the Github interface](https://github.com/Wattenberger/climate-change-industry/actions).
