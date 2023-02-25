import React, {Suspense} from "react";

import { CenteredTabs } from './component/Tabs';
// import ViewPages from './page/ViewPages';
// import DownloadsPage from './page/DownloadsPage'
// import UsersPage from "./page/UsersPage";

const ViewPages = React.lazy(()=> import("./page/ViewPages"));
const DownloadsPage = React.lazy(()=> import("./page/DownloadsPage"));
const UsersPage = React.lazy(()=> import("./page/UsersPage"));

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
      <CenteredTabs
        labels={[
          // "Logs",
          "Views",
          "Downloads",
          "Users",
        ]}
      >
        {/* <p>test</p> */}
        <ViewPages />
        <DownloadsPage />
        <UsersPage />
      </CenteredTabs>
      </Suspense>
    </div>
  );
}

export default App;
