import React, { useEffect, useState } from 'react'
import SimpleSelect from '../component/SimpleSelect'
import { Years, Months } from '../data/data'
import { VerticalTabs } from '../component/Tabs'
import ViewSummary from './ViewSummary'
import ViewDetails from './ViewDetails'
import { pyGetFileList, pyGetFiles, jsGetFileList, jsGetFiles } from '../function/filer'
import ReportView from './ReportView'
import ProjectView from './ProjectView'
import axios from 'axios'
import { ContactsOutlined } from '@material-ui/icons'


const ViewPages = () => {

  const [filterData, setFilterData] = useState([]);
  const [data, setData] = useState([])
  const [users, setUsers] = useState([])
  const [rawData, setRawData] = useState([])

  const [val, setVal] = useState({
    Name: '',
    Month: "4",
    Year: "2022",
    type: "",
    status: ""
  });


  useEffect(() => {
    // axios.get('api/xxx3').then(r=>{
    //   console.log(r.data)
    // })
    /** resultフォルダ内のデータ取得 */
    async function fetchData() {
      //! --- mode ---
      const lng_mode = 'py' // 'py'  'js'
      let fileList = {}
      let dataList = []
      if (lng_mode === 'py') {
        // fileList = await pyGetFileList() //* --- get file list ---
        const filelist_req = await axios.get('/api/xxx3')
        fileList = filelist_req.data //* --- get file list ---
        // console.log(fileList)
        // dataList = await pyGetFiles(fileList) //* --- get worktime data each file. ---
        const datas = await axios.post('/api/data', {
          files: fileList
        }) //* --- get worktime data each file. ---
        // console.log(datas.data)
        dataList = datas.data
        console.log(dataList)
      } else {
        // fileList = await jsGetFileList()      //* --- get file list ---
        // dataList = await jsGetFiles(fileList) //* --- get worktime data each file. ---
      }
      // console.log(fileList)
      // console.log(dataList)
      setRawData(dataList)
      

      // get unique users list from alldata.
      const uniqueUsers = dataList
        .filter((item, i, self) => self.findIndex(e => e.Num === item.Num) === i)
        .map((x) => ({ value: x.Name, label: x.Name }))
      uniqueUsers.unshift({ value: "All", label: "All" })
      setUsers(uniqueUsers)
      // console.log(uniqueUsers)

      // フィルタ初期値を現在年月に設定
      const dt = new Date();
      const newFilter = { ...val, Name: 'All', Year: String(dt.getFullYear()), Month: String(dt.getMonth() + 1)}
      setVal(newFilter)
      
      // Group by 日付,社員番号
      const newData = dataList.filter((item, i, self) =>
      self.findIndex(e => e.date === item.date && e.Num === item.Num) === i)
      setData(newData)
      

      console.log(newFilter)
      console.log(newData)
      
      // フィルタを適用
      const newFilterData = newData.filter(item =>
        (newFilter.Name !== "All" ? item.Name === newFilter.Name : true)
          && item.date.split('-')[0] === newFilter.Year
          && item.date.split('-')[1] === newFilter.Month)
      // console.log(newFilterData)
      setFilterData(newFilterData)

    }
    fetchData()

  }, []); // val


  const handleChange = (event) => {
    // console.log([event.target.name], event.target.value)
    const newFilter = { ...val, [event.target.name]: event.target.value }
    setVal(newFilter);
    console.log(newFilter);
    const newData = data.filter(item =>
      (newFilter.Name !== "All" ? item.Name === newFilter.Name : true)
      && item.date.split('-')[0] === newFilter.Year
      && item.date.split('-')[1] === newFilter.Month
    )
    setFilterData(newData)
  };


  const verTabStyle = {
    display: "flex", gap: 20,
    minWidth: 240,
    margin: 20,
    width: '80%',
  }

  return (
    <div>
      {/* Year, Month */}
      <div style={verTabStyle}>
        <SimpleSelect options={users} name="Name" val={val} initialValue={""} handleChange={handleChange} />
        <SimpleSelect options={Years} name="Year" val={val} initialValue={""} handleChange={handleChange} />
        <SimpleSelect options={Months} name="Month" val={val} initialValue={""} handleChange={handleChange} />
      </div>

      <VerticalTabs labels={["report", "summary", "details", "project"]}>
        <ReportView
          handleChange={handleChange}
          users={users} val={val}
          filterData={filterData}></ReportView>
        <ViewSummary
          handleChange={handleChange}
          users={users} val={val}
          filterData={filterData}>
        </ViewSummary>
        <ViewDetails
          handleChange={handleChange}
          users={users} val={val}
          filterData={filterData}
        />
        <ProjectView
          handleChange={handleChange}
          users={users} val={val}
          data={rawData} filterData={filterData}>
        </ProjectView>
        
      </VerticalTabs>
    </div>
  )
}

export default ViewPages