const { useState, useEffect } = React;
const { makeStyles, Tabs, Tab, Paper, Box } = MaterialUI;
const { Switch, FormControlLabel } = MaterialUI;
const { TextField, Button, InputLabel, MenuItem, FormControl, Select } = MaterialUI;




// 追加


const VericalTabs = (props) => {

};

  /** Select Options
   * Month, Year,
   * ProjectCode,
   * Status
   */

  /** Summary Table
   * Count of Status
   */

  // todo:
  /**
   * mg_dh_holiday: 休日出勤
   * 日次提出 ← 日次提出
   */

const ViewPages = () => {

}



// todo: あとで下のページ
const ViewSummary = (props) => {

}

const ViewDetails = (props) => {

}

/** NOT USE */
const DragOnDragView = () => {

  return (
    <DropArea onDrop={handleDrop}>
      <div style={{ width: 600, height: 300, border: "solid", borderWidth: 2 }}>
        ドロップエリアですぅ
      </div>
    </DropArea>
  )
}

const handleDrop = async (e) => {

  const item = e.dataTransfer.items[0];
  const entry = item.webkitGetAsEntry();

  const fileList = []; // 取得したファイルを格納するリスト

  // ファイルスキャン関数
  const traverseFileTree = async (entry, path) => {
    const _path = path || "";

    if (entry.isFile) {
      const file = await new Promise((resolve) => {
        entry.file((file) => {
          resolve(file);
        });
      });

      fileList.push({ file: file, path: _path + file.name }); // ファイルを取得したらリストにプッシュする
    } else if (entry.isDirectory) {
      const directoryReader = entry.createReader();
      const entries = await new Promise((resolve) => {
        directoryReader.readEntries((entries) => {
          resolve(entries);
        });
      });

      for (let i = 0; i < entries.length; i++) {
        await traverseFileTree(entries[i], _path + entry.name + "/"); // 再帰的な関数呼び出し
      }
    }
  };

  // ここでドロップされた最初のディレクトリ（or ファイル）を渡す
  await traverseFileTree(entry);

  // 最後にファイル一覧をログに出力
  console.log(fileList);
};

/**  */
function DropArea({ children, onDrop }) {

  const handleDragOver = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(e.dataTransfer.items[0].webkitGetAsEntry())
    onDrop(e);
  };

  return (
    <div onDragOver={handleDragOver} onDrop={handleDrop}>
      {children}
    </div>
  );
}


const DownloadsPage = () => {

}

// const SimpleSelect = (props) =>{
//   // console.log(props)
//   const {name :selectName, handleChange, val, initialValue} = props;

//   return (
//     <FormControl style={{width:'100%'}}>
//       <InputLabel id={'label-select-${props.name}'}>{selectName}</InputLabel>
//       <Select
//         labelId="select-label"
//         id="simple-select"
//         name={selectName}
//         value={val[selectName]}
//         label={selectName}
//         onChange={handleChange}
//         variant="outlined"
//         color="primary"
//       >
//         {props.options.map((option)=>(
//           <MenuItem value={option.value} key={option.value}>
//             {option.label}
//           </MenuItem>
//         ))}
//       </Select>
//     </FormControl>
//   )
// }

// HTMLのbodyで定義した id="root"のエレメントに適用する
ReactDOM.render(<App />, document.getElementById("root"));