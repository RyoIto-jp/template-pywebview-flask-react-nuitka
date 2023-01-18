import React from 'react'

const ViewDetails = (props) => {

  const { filterData } = props
  const styleTd = { width: 200, overflow: "hidden", whiteSpace: "nowrap", padding: "5px 5px" }
  console.log(filterData)

  const diffStyle = (strTime1, strTime2) => {
    // console.log(strTime1, strTime2)
    let diff = false
    if (strTime1 && strTime2) {
      const dt1 = new Date(Date.parse(`2022-01-01T${('0' + strTime1).slice(-5)}:00`)).getTime()
      const dt2 = new Date(Date.parse(`2022-01-01T${('0' + strTime2).slice(-5)}:00`)).getTime()
      diff = dt1 - dt2
      // console.log(diff,dt1, dt2)
    }
    return { backgroundColor: diff ? 'orange' : '' }
  }

  return (
    <div style={{ width: '100%' }}>
      <table border="1" style={{
        borderCollapse: "collapse",
        borderColor: "#DDD", backgroundColor: "#FFFFFF"
      }}>
        <thead>
          <tr style={{ backgroundColor: '#FFF', color: "#AAA" }}>
            <th>date</th>
            <th>Name</th>
            <th>type</th>
            <th>実働時間</th>
            <th>PJ実働</th>
          </tr>
        </thead>
        <tbody>
          {filterData.map((row, idx) => (
            <tr key={idx} style={diffStyle(row.actual, row.pjsum)}>

              <td style={styleTd}>{row.date}</td>
              <td style={styleTd}>{row.Name}</td>
              <td style={styleTd}>{row.status}</td>
              <td style={styleTd}>{('0' + row.actual).slice(-5)}</td>
              <td style={styleTd}>{('0' + row.pjsum).slice(-5)}</td>

            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}

export default ViewDetails