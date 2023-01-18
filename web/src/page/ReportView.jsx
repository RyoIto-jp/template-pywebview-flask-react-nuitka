import React, { useState, useEffect } from 'react'
import { makeStyles } from '@material-ui/styles'
// import the component
import ReactSpeedometer from "react-d3-speedometer"


const useStyles = makeStyles({
  root: {
    display: "flex",
    flexWrap: "wrap",
    gap: 20,
  },
  card: {
    width: 310,
    height: 150,
    backgroundColor: '#FAA',
    display: 'flex',
    flexDirection: 'column',
    "&>h2": {
      display: 'flex',
      justifyContent: 'space-around',
      margin: 0,
      padding: 10,
    },
    "&>section": {
      display: "flex",
      gap: 20,
    }
  },
  lastdate: {
    alignSelf: 'end',
    margin: 20,
    fontStyle: 'italic'
  },
  status: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  }
})

const ReportView = (props) => {

  const cls = useStyles()
  const statusLabels = ["日次提出", "一時保存", "未提出"]
  const [reportData, setReportData] = useState(["a", "b"])
  const users = props.users.filter(user =>
    user.label !== 'All'  // ユーザーリストからALLを除外
    && (props.val.Name === 'All' ? true : props.val.Name === user.label) // ユーザー指定あればフィルタ。なければ全員。
  )
  const [maxValue, setMaxValue] = useState(20)
  // console.log(users)

  function getCount(user, key) {
    const countData = props.filterData.filter(item => item.Name === user && item.status === key)
    return countData.length
  }

  useEffect(() => {

    const newData = users.map(user => {
      const Counts = statusLabels.map(label => {
        return getCount(user.value, label)
      })
      const totalCount = Counts.reduce((sum, count) => {
        return sum + count
      })
      setMaxValue(maxValue < totalCount ? totalCount : maxValue)
      const currentUser = props.filterData.find(row => row.Name === user.label)
      let row = {
        Name: user.value,
        LastDate: getMaxFromStringDate(user.value, "日次提出"),
        Count: getCount(user.value, "日次提出"),
        TotalCount: totalCount,
        Report: currentUser ? currentUser.Report.replace('状態：', '') : ""
      }
      // console.log(row)
      return row
    })
    // console.log(newData)
    setReportData(newData)
  }, [props]) //props


  function getMaxFromStringDate(user, key) {
    const targetDateList = props.filterData
      .filter(item => item.Name === user && item.status === key)
      .map(x => x.date)
    let maxValue = 'none'
    if (targetDateList.length > 0) {
      maxValue = targetDateList.reduce((a, b) => Date.parse(a) > Date.parse(b) ? a : b)
    }
    return maxValue
  }

  function getStatusColor(lastDate, maxValue) {
    const mode = String(lastDate).split('-')[2]
    // console.log(mode, mode > 3 ? 1 : 0)
    let statusColor = '#CCF'

    if (mode < 7) {
      statusColor = '#FAA'
    } else if (mode < 15) {
      statusColor = '#FD5'
    } else if (mode < 28) {
      statusColor = '#88F'
    } else {
      statusColor = '#CFF'
    }
    if (lastDate === 'none') statusColor = '#D77'
    // console.log(statusColor)
    return statusColor
  }

  return (
    <div>
      <div className={cls.status}>
        <div><span style={{ color: "#D77" }}>■</span>データなし</div>
        <div><span style={{ color: "#FAA" }}>■</span>7日以前未入力あり</div>
        <div><span style={{ color: "#FD5" }}>■</span>15日以前未入力あり</div>
        <div><span style={{ color: "#88F" }}>■</span>28日以前未入力あり</div>
        <div><span style={{ color: "#CFF" }}>■</span>28日まで入力OK</div>
      </div>
      <div className={cls.root}>

        {reportData.map((row, idx) => (

          <div key={idx} className={cls.card} style={{ backgroundColor: getStatusColor(row.LastDate) }}>
            <h2>
              <span>{row.Name}</span>
              <span style={{
                fontSize: 18, color: '#555', maxWidth: 140, lineHeight: 1.2,
                height: "20px",
                overflow: "hidden"
              }}>{row.Report}</span>
            </h2>
            <section>
              <ReactSpeedometer
                maxValue={maxValue}
                value={row.Count}
                needleColor="red"
                startColor="green"
                segments={4}
                endColor="blue"
                width={150}
                height={80}
                ringWidth={10}
              />
              <div className={cls.lastdate}>{row.LastDate}</div>
            </section>
          </div>


        ))}

      </div>
    </div>
  )
}

export default ReportView