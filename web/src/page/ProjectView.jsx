import React, { useEffect, useState } from 'react'
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar } from 'recharts'
import { FormControlLabel, FormControl, FormLabel, RadioGroup, Radio } from "@material-ui/core";
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    gap: 20,
  },
  radio: {
    color: "#555",
    border: "1px solid rgba(100,100,100,.1)",
    background: "rgb(250, 245, 250)",
    padding: "4px 8px",
    width: 200,
    borderRadius: 4,
    marginBottom: 4,
  }
})


/** project名から余分なテキストを削除 */
function fixTypeName(typeName) {
  return typeName.slice(typeName.indexOf("]") + 1, typeName.length)
    .replace("アウトソーシングテクノロジー", '')
    .replace("株式会社", '')
    .replace("刈谷ｱｳﾄｿｰｼﾝｸﾞﾃｸﾉﾛｼﾞｰ", '')
    .replace("機電-", '')
    .replace(/( |）|（)/g, '')
    .replace(/RD-(.*)ｱｳﾄｿｰｼﾝｸﾞﾃｸﾉﾛｼﾞｰ/g, '')
    .replace(/(.*)ｱｳﾄｿｰｼﾝｸﾞﾃｸﾉﾛｼﾞｰ/g, '')
    .replace('RD-刈谷愛三工業愛三工業', '刈谷愛三工業')
    .replace('刈谷愛三工業愛三工業', '刈谷愛三工業')
}

// hh:mm を hour(int)に変換
function strToTime(strTime) {
  const t = strTime.split(':').map(x => Number(x))
  return t[0] + t[1] / 60
}

const ProjectView = (props) => {

  const [prjList, setPrjList] = useState([""])
  const [statusList, setStatusList] = useState([""])
  const [plot, setPlot] = useState([""])
  const [optionsVal, setOptions] = useState({
    project: "ALL",
    status: "ALL"
  })
  const cls = useStyles()

  // プロット用データを作成し、必要なデータを取得する関数
  useEffect(() => {
    // propsを渡して、プロットデータを作成
    const newPlot = createPlotData(props.data, optionsVal)
    // 作成したプロットデータをstateにセット
    setPlot(newPlot)
    // 確認用
    // console.log(newPlot)
  }, [props])

  /** プロットデータ作成 */
  // const createPlotData = (data, options) => {
  //   const newData = data
  //   newData.map(row => {
  //     if (row.type) {
  //       row.type = fixTypeName(row.type)
  //     }
  //     return true
  //   })
  //   console.log(data)
  //   console.log(newData)

  //   // プロジェクトコード一覧
  //   const projects = newData
  //     .filter((x, i, self) =>
  //       self.findIndex(e => e.type === x.type) === i && x.type
  //     )
  //     .map(x=>x.type).map(row => fixTypeName(row))
  //     .filter((x, i, self) =>
  //       self.findIndex(e => e === x) === i && x
  //     )
  //     console.log(projects)
  //   setPrjList(projects)

  //   // ステータス一覧
  //   const newStatusList = newData
  //     .filter((x, i, self) => self.findIndex(e => e.status === x.status) === i && x.status)
  //     .map(x => x.status)
  //   setStatusList(newStatusList)

  //   // プロット用データ作成
  //   const newPlot = [...data]
  //     // Nameフィルタ
  //     .filter(item => (props.val.Name !== "All" ? item.Name === props.val.Name : true))
  //     // 年月フィルタ
  //     .filter(item => item.date.split('-')[0] === props.val.Year)
  //     .filter(item => item.date.split('-')[1] === props.val.Month)
  //     // Group by 氏名
  //     .filter((x, i, self) => self.findIndex(e => e.Name === x.Name) === i)
  //     .map(item => {
  //       // 工数以外のデータ構成作成
  //       const row = {
  //         Name: item.Name, comment: item.comment,
  //         status: item.status, Year: item.date.split('-')[0],
  //         Month: item.date.split('-')[1]
  //       }

  //       // 年月,氏名でフィルタ
  //       const prjRow = data.filter(org => org.date.split('-')[0] === row.Year && org.date.split('-')[1] === row.Month && org.Name === row.Name)
  //       // console.log(prjRow)
  //       // console.log(data)

  //       // projectsをフィルタ
  //       const filterProjects = projects.filter(project => options.project === "ALL" ? true : options.project === project)

  //       console.log(prjRow)
  //       // フィルタ内 ＆ プロジェクトごとに合計工数
  //       for (let project of filterProjects) {
  //         if (prjRow) {
  //           row[project] = prjRow
  //             .filter(x => fixTypeName(x.type) === project) // 現在プロジェクトのみ 
  //             .filter(x => options.status === 'ALL' ? true : options.status === x.status)
  //             .map(x => strToTime(x.times)) // 工数時刻→時間[hr]を抽出して配列に
  //             .reduce((sum, elm) => sum + elm, 0) // 合計
  //         }
  //       }
  //       return row
  //     })
  //   return newPlot
  // }

  const createPlotData = (data, options) => {
    // プロジェクトコード一覧
    const projects = data
        .filter((x, i, self) =>
          self.findIndex(e => e.type === x.type) === i && x.type
        )
        .map(x => x.type).map(row => fixTypeName(row)) // 型名を修正
        .filter((x, i, self) =>
          self.findIndex(e => e === x) === i && x
        );
    
    setPrjList(projects); // プロジェクトコード一覧を設定

    // ステータス一覧
    const newStatusList = data
        .filter((x, i, self) => self.findIndex(e => e.status === x.status) === i && x.status)
        .map(x => x.status); // ステータスのみ抽出
        
    setStatusList(newStatusList); // ステータス一覧を設定

    // プロット用データを作成します
    // 年月フィルタとProjectフィルタを使用し、各個人別にプロジェクトの作業時間を集計します
    const newPlot = data
      // 名前フィルタ
      .filter(item => (props.val.Name !== "All" ? item.Name === props.val.Name : true))
      // 年月フィルタ
      .filter(item => item.date.split('-')[0] === props.val.Year)
      .filter(item => item.date.split('-')[1] === props.val.Month)
      // Group by 氏名
      .filter((x, i, self) => self.findIndex(e => e.Name === x.Name) === i)
      .map(item => {
          // 工数以外のデータ構成作成
          const row = {
            Name: item.Name, comment: item.comment,
            status: item.status, Year: item.date.split('-')[0],
            Month: item.date.split('-')[1]
          }
          // プロジェクトごとに合計工数
          for (let project of projects) {
            if (options.project === "ALL" || options.project === project) { // プロジェクトのフィルタ
              row[project] = data
                .filter(x => x.date.split('-')[0] === row.Year && x.date.split('-')[1] === row.Month && x.Name === row.Name)
                .filter(x => fixTypeName(x.type) === project) // 現在プロジェクトのみ 
                .filter(x => options.status === 'ALL' ? true : options.status === x.status)
                .map(x => strToTime(x.times)) // 工数時刻→時間[hr]を抽出して配列に
                .reduce((sum, elm) => sum + elm, 0) // 合計
            }
          }
          return row;
        });
    return newPlot;
}


  const handleRadio = (event) => {
    console.log(event.target)

    const newOptions = { ...optionsVal, [event.target.name]: event.target.value }
    // console.log(newOptions)
    setOptions(newOptions)
    const newPlot = createPlotData(props.data, newOptions)
    setPlot(newPlot)
  }

  const plotColors = [
    "#8884d8", "#82ca9d", "#ca829d", "#CC8855", "#558888", "#FF00FF"
  ]

  return (
    <div className={cls.root}>
      {/* <pre>{"comment in tooltip, select status, project"}</pre> */}
      <BarChart width={640} height={(plot.length + 1) * 40 + 40} data={plot} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis type="category" dataKey="Name" width={80} />
        <XAxis type='number' />
        <Tooltip content={<CustomTooltip src={props} />} />
        <Legend />
        {prjList.map((project, index) => (
          <Bar dataKey={project} stackId={1} fill={plotColors[index]} key={`${project}-${index}`} />
        ))}
      </BarChart>
      <div>
        <RadioButtonComponent options={prjList} val={optionsVal} handleChange={handleRadio}>project</RadioButtonComponent>
        <RadioButtonComponent options={statusList} val={optionsVal} handleChange={handleRadio}>status</RadioButtonComponent>
      </div>
    </div>
  )
}

const RadioButtonComponent = (props) => {
  const { options, val, handleChange } = props;
  const cls = useStyles()

  return (
    <div className={cls.radio}>
      <FormControl component="fieldset" style={{ width: '100%' }}>
        <FormLabel component="legend" style={{ fontSize: 'large', paddingBottom: 4, borderBottom: "1px solid #EDD", width: '100%' }}>{props.children}</FormLabel>
        <RadioGroup aria-label={props.children} name={props.children} value={val[props.children]} onChange={handleChange}>
          <FormControlLabel value="ALL" control={<Radio />} label="ALL" />
          {options.map((option, index) => (
            <FormControlLabel value={option} control={<Radio color='primary' />} label={option} key={`${props.children}-${index}`} />
          ))}
        </RadioGroup>
      </FormControl>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label, src }) => {
  // console.log(payload)
  const tooltip = src.data.filter(x =>
    x.Name === label
    && x.date.split('-')[0] === src.val.Year
    && x.date.split('-')[1] === src.val.Month
    && x.type.indexOf('0項番') !== -1
    && x.status === '日次提出'
  )
  const total = Math.round(payload.map(x => x.value).reduce((sum, elm) => sum + elm, 0) * 10) / 10
  // console.log(tooltip)
  const styled = {
    background: '#EEEEFEEF',
    padding: 8,
    border: "1px solid #CCCCCCAA",
    borderRadius: 8
  }
  if (active && payload && payload.length) {
    return (
      <div style={styled}>
        <p className="label">{`${label} : ${total}hr`}</p>
        <div>
          {tooltip.length > 0 && <table border={1} style={{
            borderCollapse: "collapse",
            borderColor: "#DDD", backgroundColor: "#FFFFFFAA",
            color: "#555", fontSize: '14px'
          }}>
            <thead>
              <tr>
                <th>date</th>
                <th>type</th>
                <th>times</th>
                <th>comment</th>
              </tr>
            </thead>
            <tbody>
              {tooltip.map((row, idx) => (
                <tr key={`tooltip-row-${idx}`}>
                  <td>{row.date}</td>
                  <td>{fixTypeName(row.type)}</td>
                  <td>{row.times}</td>
                  <td>{row.comment}</td>
                </tr>
              ))}

            </tbody>
          </table>}
        </div>
      </div>
    );
  }


  return null;
};

export default ProjectView