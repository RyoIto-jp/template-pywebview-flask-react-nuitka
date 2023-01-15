import React from 'react'

const ViewSummary = (props) => {

  const summaryData = props.filterData.filter((x, i, self) => (
    self.findIndex(el => x.Name === el.Name) === i
  ))
  // console.log(props.filterData)

  function getCount(user, key) {
    const countData = props.filterData.filter(item => item.Name === user && item.status === key)
    return countData.length
  }

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
  const styleTd = {
    width: 200,
    overflow: "hidden",
    whiteSpace: "nowrap",
    padding: "5px 5px",
    color: "#333"
  }

  return (
    <div style={{ width: '100%' }}>
      <table border="1" style={{
        borderCollapse: "collapse",
        borderColor: "#DDD", backgroundColor: "#FFFFFF"
      }}>
        <thead>
          <tr style={{ backgroundColor: '#FFF', color: "#AAA" }}>
            <th rowSpan="2">name</th>
            <th rowSpan="2">report</th>
            <th colSpan="2">日次提出</th>
            <th colSpan="2">一時保存</th>
            <th colSpan="2">未提出</th>
          </tr>
          <tr style={{ backgroundColor: '#FFF', color: "#AAA" }}>
            <th>Count</th>
            <th>Max</th>
            <th>Count</th>
            <th>Max</th>
            <th>Count</th>
            <th>Max</th>
          </tr>
        </thead>
        <tbody>
          {summaryData.map((row, idx) => (
            <tr key={`row-${idx}`}>

              <td style={styleTd}>{row.Name}</td>
              <td style={styleTd}>{row.Report}</td>
              <td style={styleTd}>{getCount(row.Name, '日次提出')}</td>
              <td style={styleTd}>{getMaxFromStringDate(row.Name, '日次提出')}</td>
              <td style={styleTd}>{getCount(row.Name, '一時保存')}</td>
              <td style={styleTd}>{getMaxFromStringDate(row.Name, '一時保存')}</td>
              <td style={styleTd}>{getCount(row.Name, '未提出')}</td>
              <td style={styleTd}>{getMaxFromStringDate(row.Name, '未提出')}</td>

            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}

export default ViewSummary