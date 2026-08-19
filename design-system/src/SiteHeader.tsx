export interface SiteHeaderProps {
  /** Text for the #logo home link, defaults to "Miguel Solorio". */
  logo?: string
  /** Applies the scrolled glass treatment (translucent background, hairline border, blur, shadow), defaults to true. */
  glass?: boolean
}

/** Sticky site header with the wordmark, LinkedIn and GitHub links, and the theme toggle, mirroring layouts/partials/header.html and navigation.html. */
export function SiteHeader({ logo = 'Miguel Solorio', glass = true }: SiteHeaderProps) {
  return (
    <nav
      className="site-header"
      aria-label="Primary navigation"
      style={
        glass
          ? {
              backgroundColor: 'rgba(245, 245, 245, .72)',
              borderBottom: '1px solid rgba(15, 23, 42, .08)',
              boxShadow: 'var(--shadow-sm)',
              WebkitBackdropFilter: 'blur(12px) saturate(180%)',
              backdropFilter: 'blur(12px) saturate(180%)',
            }
          : undefined
      }
    >
      <style>
        {[
          glass
            ? '.dark .site-header{background-color:rgba(25, 22, 32, .72) !important;border-bottom-color:rgba(210, 202, 222, .13) !important}'
            : '',
          '#linkedin,#github{color:#334155;background-image:none;box-shadow:none;margin-inline:0;padding-inline:.375rem;text-decoration:none}',
          '.dark #linkedin,.dark #github{color:#ede7f2}',
          '#linkedin:hover,#github:hover{color:#fff;background-color:#3429ff}',
          '.dark #linkedin:hover,.dark #github:hover{color:#110e1a;background-color:#efa9ae}',
        ].join('')}
      </style>
      <div className="site-shell site-header-inner">
        <a id="logo" href="/">
          {logo}
        </a>
        <div className="social">
          <a
            id="linkedin"
            href="https://www.linkedin.com/in/miguel-solorio-a432b021"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.0123 18.1494H13.8024V44.6017H5.0123V18.1494ZM9.46621 5.39819C6.45771 5.39819 4.49219 7.37329 4.49219 9.96567C4.49219 12.5047 6.40019 14.5373 9.35117 14.5373H9.40723C12.4732 14.5373 14.3826 12.5046 14.3826 9.96567C14.3251 7.37329 12.4733 5.39819 9.46621 5.39819ZM35.3847 17.528C30.7187 17.528 28.6284 20.0944 27.4623 21.8942V18.1494H18.6695C18.7859 20.6309 18.6695 44.6017 18.6695 44.6017H27.4623V29.8289C27.4623 29.0376 27.5198 28.2494 27.7512 27.6826C28.3878 26.1031 29.8345 24.4674 32.2611 24.4674C35.4449 24.4674 36.7164 26.8943 36.7164 30.4487V44.6016H45.5078V29.4334C45.5078 21.3084 41.1717 17.528 35.3847 17.528Z"
                fill="currentColor"
              />
            </svg>
          </a>
          <a
            id="github"
            href="https://github.com/miguelsolorio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24.9255 1C11.1423 1 0 12.2245 0 26.1107C0 37.2107 7.13928 46.6066 17.0434 49.9321C18.2816 50.1821 18.7352 49.3918 18.7352 48.727C18.7352 48.1449 18.6944 46.1495 18.6944 44.0704C11.7607 45.5673 10.3168 41.077 10.3168 41.077C9.20255 38.1668 7.55153 37.4189 7.55153 37.4189C5.28214 35.8806 7.71684 35.8806 7.71684 35.8806C10.2342 36.0469 11.5551 38.4582 11.5551 38.4582C13.7832 42.2827 17.3735 41.202 18.8179 40.5367C19.024 38.9153 19.6847 37.7929 20.3862 37.1694C14.8561 36.5872 9.03776 34.4255 9.03776 24.7801C9.03776 22.0362 10.0276 19.7913 11.5959 18.0454C11.3485 17.4219 10.4816 14.8439 11.8439 11.3934C11.8439 11.3934 13.9485 10.7281 18.6939 13.9709C20.7256 13.4213 22.8208 13.1416 24.9255 13.1393C27.0301 13.1393 29.1755 13.4306 31.1566 13.9709C35.9026 10.7281 38.0071 11.3934 38.0071 11.3934C39.3694 14.8439 38.502 17.4219 38.2546 18.0454C39.8643 19.7913 40.8133 22.0362 40.8133 24.7801C40.8133 34.4255 34.9949 36.5454 29.4235 37.1694C30.3316 37.9592 31.1153 39.4556 31.1153 41.8255C31.1153 45.1929 31.0745 47.8954 31.0745 48.7265C31.0745 49.3918 31.5286 50.1821 32.7663 49.9327C42.6704 46.6061 49.8097 37.2107 49.8097 26.1107C49.8505 12.2245 38.6673 1 24.9255 1Z"
                fill="currentColor"
              />
            </svg>
          </a>
          <button id="theme-toggle" type="button" aria-label="Switch to dark mode" aria-pressed="false">
            <svg id="theme-toggle-light-icon" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
