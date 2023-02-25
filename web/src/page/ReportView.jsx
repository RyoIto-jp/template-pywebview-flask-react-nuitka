import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/styles";
// import the component
// import ReactSpeedometer from "react-d3-speedometer"
// import { PieChart, Pie, Tooltip } from 'recharts';
// import { PieChart, Pie, Tooltip } from "../function/Recharts";
// import {Tooltip} from "recharts/es6/component/Tooltip";
// import {PieChart} from 'recharts/es6/chart/PieChart';
// import {Pie} from 'recharts/es6/polar/Pie';

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexWrap: "wrap",
    gap: 20,
  },
  card: {
    width: 310,
    height: 200,
    backgroundColor: "#FAA",
    display: "flex",
    flexDirection: "row",
    "border-radius": "8px",
    "box-shadow": "2px 3px 3px 2px #0a0a0a50",
    "&>div": {
      width: 150,
      paddingLeft: 8,
    },
    "&>section": {
      display: "flex",
      gap: 20,
    },
  },
  status: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  plot: {
    "&>div.recharts-wrapper": {
      "&>svg": {
        overflow: "visible",
        position: "absolute",
        bottom: "-20px",
      },
    },
  },
  calendar: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr",
    "&>span": {
      border: "1px solid #cccccc80",
      padding: "2px 2px",
      textAlign: "center",
      // color: "#fc2424",
    },
  },
});

const ReportView = (props) => {
  const cls = useStyles();
  const [state, setState] = useState({ calendar: [] });
  const statusLabels = ["日次提出", "一時保存", "未提出"];
  const [reportData, setReportData] = useState([{ Name: "", Value: [] }]);
  const users = props.users.filter(
    (user) =>
      user.label !== "All" && // ユーザーリストからALLを除外
      (props.val.Name === "All" ? true : props.val.Name === user.label) // ユーザー指定あればフィルタ。なければ全員。
  );
  const [maxValue, setMaxValue] = useState(20);
  // console.log(users)

  // 選択月の末尾を取得
  const lastDate = new Date(props.val.Year, props.val.Month, 0).getDate();

  function getCount(user, key) {
    const countData = props.filterData.filter((item) => item.Name === user && item.status === key);
    return countData.length;
  }

  useEffect(() => {
    console.log(props.val);
    const newData = users.map((user) => {
      // StatusLabel別の提出数をカウント
      const Counts = statusLabels.map((label) => {
        return getCount(user.value, label);
      });
      // 全StatusLabelを合わせた合計カウント
      const totalCount = Counts.reduce((sum, count) => {
        return sum + count;
      });
      // 最大入力日を更新
      setMaxValue(maxValue < totalCount ? totalCount : maxValue);
      const currentUser = props.filterData.find((row) => row.Name === user.label);
      let row = {
        Name: user.value,
        LastDate: getMaxFromStringDate(user.value, "日次提出"),
        Count: getCount(user.value, "日次提出"),
        TotalCount: totalCount,
        Report: currentUser ? currentUser.Report.replace("状態：", "") : "",
        Value: props.filterData.filter((row) => row.Name === user.value && row.status === "日次提出").map((row) => row.date.split("-")[2]),
      };
      // console.log(row)
      return row;
    });
    // console.log(newData)
    setReportData(newData);
    createCalendar(Number(props.val.Year), Number(props.val.Month));
  }, [props]); //props

  function getMaxFromStringDate(user, key) {
    const targetDateList = props.filterData.filter((item) => item.Name === user && item.status === key).map((x) => x.date);
    let maxValue = "none";
    if (targetDateList.length > 0) {
      maxValue = targetDateList.reduce((a, b) => (Date.parse(a) > Date.parse(b) ? a : b));
    }
    return maxValue;
  }

  function getStatusColor(lastDate, maxValue) {
    const mode = String(lastDate).split("-")[2];
    // console.log(mode, mode > 3 ? 1 : 0)
    let statusColor = "#CCF";

    if (mode < 7) {
      statusColor = "#FAA";
    } else if (mode < 15) {
      statusColor = "#FD5";
    } else if (mode < 28) {
      statusColor = "#88F";
    } else {
      statusColor = "#CFF";
    }
    if (lastDate === "none") statusColor = "#D77";
    // console.log(statusColor)
    return statusColor;
  }

  function createCalendar(year, month) {
    const weeks = ["日", "月", "火", "水", "木", "金", "土"];

    const startDate = new Date(year, month - 1, 1); // 月の最初の日を取得
    const startDay = startDate.getDay(); // 月の最初の日の曜日を取得
    const firstDate = new Date(year, month - 1, 1 - startDay);
    let myDate = firstDate;
    const calendar = [...Array(42)].map((_, i) => {
      const temp = {
        type: myDate.getMonth() - month + 1, // -1:prev, 0:current, 1:next
        date: myDate.getDate(),
        yobi: weeks[myDate.getDay()],
      };
      myDate.setDate(myDate.getDate() + 1);
      return temp;
    });
    console.log(sliceByNumber(calendar, 7));
    setState({ calendar: calendar });
    // console.log(JSON.stringify(sliceByNumber(calendar,7), null, "\t"));
  }

  const sliceByNumber = (array, number) => {
    const length = Math.ceil(array.length / number);
    return new Array(length).fill().map((_, i) => array.slice(i * number, (i + 1) * number));
  };

  return (
    <div>
      <div className={cls.status}>
        <div>
          <span style={{ color: "#D77" }}>■</span>データなし
        </div>
        <div>
          <span style={{ color: "#FAA" }}>■</span>7日以前未入力あり
        </div>
        <div>
          <span style={{ color: "#FD5" }}>■</span>15日以前未入力あり
        </div>
        <div>
          <span style={{ color: "#88F" }}>■</span>28日以前未入力あり
        </div>
        <div>
          <span style={{ color: "#CFF" }}>■</span>28日まで入力OK
        </div>
      </div>
      <div className={cls.root}>
        {reportData.map((row, idx) => (
          <div key={idx} className={cls.card} style={{ backgroundColor: getStatusColor(row.LastDate) }}>
            <div>
              <h2>{row.Name}</h2>
              <span>{row.Report}</span>
              <div>{row.LastDate}</div>
            </div>
            <section className={cls.plot}>
              <div className={cls.calendar}>
                {state.calendar.map((item, i) => (
                  <span
                    key={i}
                    style={{
                      color: item.type === 0 ? "white" : "transparent",
                      backgroundColor: row.Value.includes(String(item.date)) && item.type === 0 ? "#668888" : "#88888840",
                    }}
                  >
                    {item.date}
                  </span>
                ))}
              </div>
            </section>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportView;
