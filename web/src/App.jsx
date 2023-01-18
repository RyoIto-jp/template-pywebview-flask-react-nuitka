import React, { Component } from "react";
// import {hot} from 'react-hot-loader'
// import './App.css';

import { CenteredTabs } from './component/Tabs';
import ViewPages from './page/ViewPages';
import DownloadsPage from './page/DownloadsPage'
import UsersPage from "./page/UsersPage";

// import { eel } from "./function/eel.js";

class App extends Component {
  constructor(props) {
    super(props);
    // eel.set_host("ws://localhost:8888");
    // eel.hello();
  }
  render() {
    return (
      <div>
        <CenteredTabs labels={[
          "Views",
          "Downloads",
          "Users",
          // "Logs",
        ]}>
          <ViewPages></ViewPages>
          <DownloadsPage></DownloadsPage>
          <UsersPage></UsersPage>
          {/* <p>test</p> */}
          {/* <p>test</p> */}
          {/* <p>test</p> */}
        </CenteredTabs>
      </div>
    );
  }
}

export default App;
// export default process.env.NODE_ENV === "development" ? hot(module)(App) : App
