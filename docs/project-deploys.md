# Project deploys

Game repos deploy themselves to `/projects/<repo>/` by calling
`.github/workflows/deploy-project.yml`. It syncs the build the repo already
uploads for GitHub Pages into that folder, with its own manifest, so the site
deploy never touches it.

To add a repo:

1. Add `FTP_SERVER`, `FTP_USERNAME`, and `FTP_PASSWORD` for the FTP account
   scoped to `projects/` to its Actions secrets.
2. Build with relative asset paths (`base: './'` in Vite), since the same build
   is served from github.io and from this site.
3. Add a job after the one that uploads the Pages artifact:

   ```yaml
   deploy-site:
     needs: build
     uses: miguelsolorio/miguelsolorio.com/.github/workflows/deploy-project.yml@master
     secrets:
       FTP_SERVER: ${{ secrets.FTP_SERVER }}
       FTP_USERNAME: ${{ secrets.FTP_USERNAME }}
       FTP_PASSWORD: ${{ secrets.FTP_PASSWORD }}
   ```
