import axios from 'axios'

const eel = window["eel"];

function mapCSVToArray(csv) {
  const dataRows = csv.split('\r\n').filter(row => row.length > 1) //filterで空行はじく
  const header = dataRows[0].split(',')
  // console.log(header)
  // console.log(dataRows)

  const newData = dataRows.slice(1).map((row, idx) => {
    const cells = row.split(',')
    let obj = {};
    // console.log(row)
    header.forEach((key, index) => {
      obj[key] = cells[index]
    })
    return obj
  })
  // console.log(newData)
  return newData
}

const loadFile = async (_filename) => {
  // const fetchApi = axios.get("../result/" + _filename)
  const fetchApi = axios.get("../result/" + _filename)
  const rows = await fetchApi;
  // console.log(rows)
  return rows.data
}

/** Python版ファイルリスト取得 */
export const pyGetFileList = async () => {
  let result = await eel.getFileList()();
  return result
}
export async function pyGetFiles(fileList) {
  const result = await eel.getFileDatas(fileList.data)();
  return result
}
/** JS版ファイルリスト取得 */
export async function jsGetFileList() {
  const fileListApi = axios.get("../result")
  let fileList = await fileListApi;
  return fileList
}
export async function jsGetFiles(fileList) {
  const dataList = []
  for (let i = 0; i < fileList.data.length; i++) {
    const response = await loadFile(fileList.data[i])
    const csvdata = await mapCSVToArray(response)
    dataList.push(...csvdata)
  }
  return dataList
}