import React, { Suspense } from 'react';

const Description = React.lazy(() => import('./Description'));

function App() {
  return (
    <div>
      <h1>My Movie</h1>
      <Suspense fallback="Loading...">
        <Description />
        <div>
          <Suspense fallback="Sorry for our laziness">
            <span>Cast</span>
            <AnotherLazyComponent />
          </Suspense>
        </div>
      </Suspense>
    </div>
  );
}

const AndYetAnotherLazyComponent = React.lazy(() =>
  import('./AndYetAnotherLazyComponent')
);

function AnotherLazyComponent() {
  return (
    <div>
      <span>So...so..lazy..</span>
      <AndYetAnotherLazyComponent />
    </div>
  );
}

export default App;
