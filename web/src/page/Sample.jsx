const { useState, useEffect, useRef, useMemo, useCallback } = React;
const {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField,
    colors,
    ThemeProvider,
    Container,
    makeStyles,
    createMuiTheme,
    Modal,
    Box,
    FormControl,
    InputLabel,
    Select,
    Menu,
    MenuItem,
    Switch,
    FormControlLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    Popover,
    Typography,
} = MaterialUI;

// styled-component定義
const { styled } = window;
const marked = window.marked.marked;
// import hljs from 'highlight.js/lib/core';

// Title設定
document.title = "SimpleToDo Apps - Lychee Redmine";

// styled-componentを使って li ベースのスタイルを作成
// cssのように font-size と記述可能。
// 擬似クラス(:hoverなど)の設定も可能
const StyleLi = styled.li`
  list-style: none;
  width: 100%;
  max-width: 1200px;
  /* ul > li > div {
    padding-left: 20px;
  } */
  div {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    max-width: 1200px;
    margin-top: 4px;
    > div {
      display: flex;
      gap: 8px;
      width: 100%;
      max-width: 600px;
      padding-left: 10px;
      font-size: 18px;
      > a {
        position: relative;
        align-self: center;
        text-align: center;
        width: 50px;
        padding: 0 8px;
        border-radius: 16px;
        text-decoration: none;
        background-color: #485dd4ac;
        color: rgba(255, 255, 255, 0.8);
        line-height: 24px;
        font-size: 12px;
        ::before {
          position: absolute;
          top: -34px;
          left: -1.8px;
          height: 46px;
          content: "_";
          border-left: dotted #636fdd40 1px;
          color: transparent;
        }
      }
      > div input {
        min-width: 300px;
      }
    }
    section {
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      width: 500px;
      color: #aaa;
      div.username {
        width: 30px;
      }
      div {
        margin: 0 2px;
        text-align: center;
        font-size: 12px;
        button span {
          width: 10px;
        }
        .MuiButton-root {
          min-width: 10px;
        }
      }
      button {
        /* align-self: flex-end; */
      }
      .statuses {
        height: 51.2px;
        justify-content: center;
        width: 7rem;
      }
    }
  }
`;

const StyleFilter = styled.div`
  /* border: 1px solid #888;
  border-radius: 8px; */
  margin-bottom: 2rem;
  max-width: 1200px;
  div {
    background-color: #eee;
  }
  div#filter-box {
    display: flex;
    width: 100%;
    max-width: 1200px;
    div {
      flex: 1;
      .MuiInputLabel-filled.MuiInputLabel-shrink {
        transform: translate(12px, -5px) scale(0.75);
      }
    }
  }
`;

const StyleMarkdownSpan = styled.div`
  flex: 1;
  padding: 4px;
  margin: 8px 4px 4px 4px;
  border: 1px solid rgb(200, 200, 200);
  border-radius: 4px;
  word-break: break-all;
  height: 315;
  overflow-y: scroll;
  pre {
    background-color: rgba(217, 215, 215, 0.2);
    overflow-x: scroll;
    margin: 4px;
    zoom: 0.8;
    code {
      font-family: consolas;
    }
  }
`;

/** Markdown->HTML */
function renderMD(mdText) {
    var highlight = function (code, lang) {
        return hljs.highlightAuto(code, [lang]).value;
    };
    var renderer = new marked.Renderer();
    // console.log(mdText);
    return marked(mdText, {
        highlight: highlight,
        renderer: renderer,
    });
}

/** Issuesをソートして最初のprjにlabel付与 */
function fixIssueDict(data) {
    const newData = [...data].sort((a, b) => a.id - b.id).sort((a, b) => a.project.id - b.project.id);
    newData
        .filter((x) => x.parent === undefined)
        .forEach((x, i) => {
            if (i <= 0 || x.project.id !== newData.filter((x) => x.parent === undefined)[i - 1].project.id) {
                console.log("aaaaaa");
                return (x.label = true);
            }
        });
    // console.log(newData.filter((x, i) => x.parent === undefined).forEach((x) => console.log(x.label, x.id, x.project.id, x.parent)));
    return newData
}

const IsLocal = location.hostname == "127.0.0.1" ? true : false;
const host_name = IsLocal ? "http://localhost:3000" : "";
const tempdata = IsLocal ? defaultValue["issues.json"].issues : [];

const App = () => {
    const [projects, setProjects] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [issues, setIssues] = useState([]);
    const [val, setVal] = useState([]);
    const [issueFilter, setIssueFilter] = useState({ userId: 0 });
    const [loading, setLoading] = useState(false);
    const sampleText = "タスク管理";
    const APIKEY = IsLocal ? "d77cad43a993af38b13673f64d39d5a4c29b3b1d" : ViewCustomize.context.user.apiKey;
    const config = {
        headers: {
            "X-Redmine-API-Key": APIKEY,
            "Content-Type": "application/json",
        },
    };

    // ページロード時に発火。プロジェクト,Status一覧を取得する。
    useEffect(() => {
        const projectsApi = axios.get(host_name + "/projects.json");
        const statusesApi = axios.get(host_name + "/issue_statuses.json");

        // 所属プロジェクト確認用にUser/membershipsを取得
        const user_id = IsLocal ? 7 : ViewCustomize.context.user.id;
        const usersApi = axios.get(host_name + "/users/" + String(user_id) + ".json?include=memberships");

        Promise.all([projectsApi, statusesApi, usersApi]).then(([resProjects, resStatuses, resUsers]) => {
            console.log(resStatuses.data.issue_statuses);
            setStatuses(resStatuses.data.issue_statuses);

            console.log(fixIssueDict(tempdata).map(x => [x.id, x.project.id, x.label, x.parent]))
            setIssues(fixIssueDict(tempdata)); // debug用

            // 自分が参加しているプロジェクトのみに絞る
            const myPrjIds = resUsers.data.user.memberships.map((x) => x.project.id);
            const newProjects = resProjects.data.projects.filter((prj) => myPrjIds.includes(prj.id));
            setProjects(newProjects);
        });
    }, []);

    /** RedmineへのHttpリクエスト */
    // const requestRedmine = (issue_id, project_id, parent_id, subject, method) => {
    const requestRedmine = async (formData, method) => {
        console.log(formData, method);

        // 受け取りデータサンプル
        const orgIssue = {
            id: "id", // PUT, DELETE
            project_id: "prj", // POST
            parent_id: "parent", //POST
            subject: "", // POST, PUT
            assigned_to_id: IsLocal ? 7 : ViewCustomize.context.user.id, // POST, PUT
        };

        if (method === "PUT") {
            const data = {
                issue: formData,
            };
            console.log(data);

            axios
                .put("/issues/" + formData.id + ".json", data)
                .then((response) => {
                    console.log(response);

                    let targetIssue = [...issues].find((x) => x.id === data.issue.id);
                    console.log(targetIssue);
                    axios.get("/issues/" + formData.id + ".json").then((r) => {
                        console.log(r.data);
                        targetIssue = Object.assign(targetIssue, r.data.issue);
                        setIssues([...issues, ...targetIssue]);
                    });
                })
                .catch((error) => {
                    console.log(error);
                    if (IsLocal) {
                        let targetIssue = [...issues].find((x) => x.id === data.issue.id);
                        console.log(targetIssue);
                        targetIssue = Object.assign(targetIssue, data.issue);
                        setIssues([...issues, ...targetIssue]);
                    }
                });
        } else if (method === "POST") {
            const data = {
                issue: {
                    project_id: formData.project_id,
                    parent_id: formData.parent_id,
                    subject: formData.subject,
                    assigned_to_id: IsLocal ? 7 : ViewCustomize.context.user.id,
                },
            };
            console.log(data);
            axios
                .post("/issues.json", data)
                .then((response) => {
                    console.log(response);
                    setIssues([...issues, response.data.issue]);
                })
                .catch((error) => {
                    if (IsLocal) {
                        console.log(error);
                        const tempRow = {
                            id: 9999,
                            parent: { id: formData.parent_id },
                            subject: formData.subject,
                            project: { id: formData.project_id },
                            status: { id: 7, name: "TEST" },
                            author: { id: 7, name: "TESTAUTHOR" },
                            start_date: "2022-01-01",
                            due_date: "2022-12-31",
                            assigned_to: { id: 7, name: "TESTASSIGNED" },
                        };
                        console.log(issues, tempRow);
                        setIssues([...issues, tempRow]);
                    }
                });
        } else if (method === "DELETE") {
            console.log("DELETE");
            axios
                .delete("/issues/" + formData.id + ".json")
                .then((response) => {
                    console.log(response);
                    const newData = issues.filter((n) => n.id !== formData.id);
                    setIssues(newData);
                    console.log(newData);
                })
                .catch((error) => {
                    console.log(error);
                    if (IsLocal) {
                        const newData = issues.filter((n) => n.id !== formData.id);
                        setIssues(newData);
                    }
                });
        } else {
            alert("method error!");
        }
    };

    const loadStart = () => {
        console.log(loading);
        setLoading(true);
    };
    // プロジェクト選択をしたら、Issuesを取得する。
    const handleChange = async (event) => {
        loadStart();
        console.log("handlechange");
        console.log({ ...val, [event.target.name]: event.target.value });
        setVal({ ...val, [event.target.name]: event.target.value });
        console.log(event.target);
        const user_id = IsLocal ? 7 : ViewCustomize.context.user.id;
        // console.log(event.target.name);

        if (event.target.name === "Project") {
            const filterQuery = event.target.value > 0 ? "project_id=" + event.target.value : "assigned_to_id=" + String(user_id);
            axios.get(host_name + "/issues.json?status_id=*&limit=100&" + filterQuery, config).then((r) => {
                let newData = r.data.issues.sort((a, b) => a.id - b.id);
                // setIssues(newData)
                setIssues([]);
                console.log(r.data);
                console.log(r.data.total_count);

                // データ数が100を超えると1APIでは取得できないので、複数回繰り返す。
                if (r.data.total_count > 100) {
                    const iterateCount = Math.ceil(r.data.total_count / 100);
                    // 複数のpromise(getリクエスト)を取得する。
                    const promise = getIssuesOfs(iterateCount, filterQuery);
                    loadStart();
                    // 全リクエストが返ってきたら発火
                    Promise.all(promise).then((response) => {
                        // console.log(response)
                        let addData = [];
                        // 結果値を全て1つの配列にまとめる
                        response.forEach((x) => (addData = [...addData, ...x.data.issues]));
                        // 初回の結果とまとめる
                        const data = [...newData, ...addData].sort((a, b) => a.id - b.id);
                        setIssues(fixIssueDict(data));
                        console.log(data);
                        setLoading(false);
                        document.activeElement.blur();
                    });
                } else {
                    // console.log("全データ数が100未満のときの分岐");
                    setIssues(r.data.issues.sort((a, b) => a.id - b.id));
                    setLoading(false);

                    document.activeElement.blur();
                }
            });

            const getIssuesOfs = (iterateCount, filterQuery) => {
                let totalIssues = [];
                for (let i = 1; i < iterateCount + 1; i++) {
                    console.log(host_name + "/issues.json?status_id=*&offset=" + String(i) + "00&limit=100&" + filterQuery);
                    totalIssues.push(axios.get(host_name + "/issues.json?status_id=*&offset=" + String(i) + "00&limit=100&" + filterQuery, config));
                }
                return totalIssues;
            };
        }
        setLoading(false);
    };

    /** Issueの内容を修正 */
    return (
        <div>
            <MouseOverPopover />
            <h1>Redmine ToDo</h1>
            <p>{sampleText}</p>
            {loading && <CircularProgress />}
            <FilterBox issueFilter={issueFilter} setIssueFilter={setIssueFilter} statuses={statuses} />

            <SimpleSelect handleChange={handleChange} items={projects} val={val} label="Project" />

            {issues.length >= 0 && <CardList items={issues} search_id={undefined} redmine={requestRedmine} statuses={statuses} issueFilter={issueFilter} />}

            <StyleLi className="newitem" id="testfocus" style={{ marginLeft: "-20px" }}>
                <NewTextInputLine project_id={issues.length > 0 ? issues[0].project.id : ""} parent_id={""} redmine={requestRedmine} />
            </StyleLi>
        </div>
    );
};

const FilterBox = React.memo(({ issueFilter, setIssueFilter, statuses }) => {
    const [filterSts, setFilterSts] = useState(statuses);
    useEffect(() => {
        const newSts = [{ id: false, name: "すべて", is_closed: false }, ...statuses];

        console.log(newSts);
        if (statuses.length > 0) setFilterSts(newSts);
    }, [statuses]);

    /** 自分のみトグルボタン */
    const isMyIssue = (event) => {
        console.log(event.target.checked);
        if (event.target.checked) {
            const user_id = IsLocal ? 7 : ViewCustomize.context.user.id;
            setIssueFilter({ ...issueFilter, user: user_id });
        } else {
            setIssueFilter({});
        }
    };

    /** 未完了のみトグル */
    const isCloseStatus = (event) => {
        console.log(event.target.name, event.target.checked);
        setIssueFilter({ ...issueFilter, [event.target.name]: event.target.checked });
    };

    const handleChange = (event) => {
        console.log(event.target);
        setIssueFilter({ ...issueFilter, [event.target.name]: event.target.value });
    };

    return (
        <StyleFilter>
            <Accordion>
                <AccordionSummary expandIcon={<i class="fa-solid fa-chevron-down"></i>} aria-controls="panel1a-content" id="panel1a-header">
                    <div>フィルタ設定</div>
                </AccordionSummary>
                <AccordionDetails>
                    <div id="filter-box">
                        <div>
                            <FormControlLabel
                                control={<Switch defaultChecked={false} onChange={isMyIssue} inputProps={{ "aria-label": "controlled" }} color="primary" />}
                                label="自分のチケットのみ表示"
                            />
                        </div>
                        <SimpleSelect handleChange={handleChange} items={filterSts} val={issueFilter} label="status" />

                        <div>
                            <FormControlLabel
                                control={<Switch defaultChecked={true} onChange={isCloseStatus} inputProps={{ "aria-label": "controlled" }} name="is_closed" color="primary" />}
                                label="未完了のみ"
                            />
                        </div>
                    </div>
                </AccordionDetails>
            </Accordion>
        </StyleFilter>
    );
});

const SimpleSelect = React.memo((props) => {
    // console.log("simpleselect");
    const { items, handleChange, val, label } = props;
    // console.log(items)

    return (
        <FormControl variant="filled" style={{ width: "100%", maxWidth: 1200 }} id="test">
            <InputLabel id={"label-select-${props.name}"}>{label}</InputLabel>
            <Select labelId="select-label" id="simple-select" name={label} value={val[label]} label={label} onChange={handleChange} variant="outlined" color="primary" defaultValue="">
                <MenuItem value={0}>MyTasks - AllProjects - </MenuItem>
                {items.map((option) => (
                    <MenuItem value={option.id} key={option.id}>
                        {option.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
});

const SimpleSelect2 = React.memo((props) => {
    // console.log("simpleselect");
    const { items, handleSubmit, issue, label } = props;

    const handleChange = (e) => {
        console.log(e.target);
        console.log(issue.id);
        const formData = {
            id: issue.id,
            [label]: e.target.value,
        };
        handleSubmit(formData, "PUT");
    };

    return (
        <FormControl variant="outlined" sile="small" className="statuses" style={{}}>
            {/* <InputLabel id={"label-select-${props.name}"}>{issue.status.name}</InputLabel> */}
            <Select
                labelId="select-label"
                id="simple-select"
                name={label}
                value={issue.status.id}
                // label={label}
                onChange={handleChange}
                // variant="outlined"
                // size="small"
                color="primary"
                defaultValue=""
                // autowith
                displayEmpty
                style={{ height: "inherit" }}
            >
                {items.map((option) => (
                    <MenuItem value={option.id} key={option.id}>
                        {option.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
});

const MenuButton = React.memo(({ item, redmine }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [opendialog, setOpendialog] = React.useState(false);
    const [params, setParams] = React.useState({
        name: "no data",
        title: "dialogNameが指定されていません",
        subtitle: "dialogNameが指定されていません",
        multiline: false,
    });
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const confirmDelete = (item) => {
        if (confirm(`#${item.id}:${item.subject}\nを削除してもよろしいですか？`)) {
            redmine({ id: item.id }, "DELETE");
        } else {
            console.log("削除中止");
        }
        setAnchorEl(null);
    };
    const InsertChildIssue = (dialogName) => {
        if (dialogName === "child") {
            console.log("child");
            setParams({
                name: "subject",
                title: "子チケットを追加",
                subtitle: `「#${item.id}: ${item.subject}」を親チケットとして、チケットを新規作成します。`,
                multiline: false,
                default: "",
                method: "POST",
                maxWidth: "sm",
            });
        } else if (dialogName === "desc") {
            console.log("desc");
            setParams({
                name: "description",
                title: "「説明」を編集",
                subtitle: `「#${item.id}: ${item.subject}」の「説明」編集をします。`,
                multiline: true,
                default: item.description,
                method: "PUT",
                maxWidth: false,
            });
        }
        console.log(item);
        setOpendialog(true);
        setAnchorEl(null);
    };

    return (
        <div>
            <Button
                id="basic-button"
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
                style={{ width: 10 }}
            >
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </Button>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    "aria-labelledby": "basic-button",
                }}
            >
                <MenuItem onClick={() => InsertChildIssue("child")}>
                    <i class="fa-solid fa-plus-square fa-fw" style={{ color: "gray" }}></i>&nbsp; Insert Child
                </MenuItem>
                <MenuItem onClick={() => InsertChildIssue("desc")}>
                    <i class="fa-brands fa-markdown fa-fw" style={{ color: "Dodgerblue" }}></i>&nbsp;Description
                </MenuItem>
                <MenuItem onClick={() => confirmDelete(item)}>
                    <i class="fa-solid fa-trash-can fa-fw" style={{ color: "tomato" }}></i>&nbsp; Delete
                </MenuItem>
            </Menu>
            <FormDialog open={opendialog} setOpen={setOpendialog} item={item} redmine={redmine} params={params} />
        </div>
    );
});

const FormDialog = React.memo(({ open, setOpen, item, redmine, params }) => {
    const [input, setInput] = useState("");
    const handleClose = () => {
        setOpen(false);
        console.log("handleClose");
    };
    useEffect(() => {
        // console.log(params.default);
        setInput(params.default);
    }, [params]);

    const handleChange = (e) => {
        // console.log(e.target.name + ":" + e.target.value);
        setInput(e.target.value);
    };

    const handleSubmit = () => {
        let sendData = {
            project_id: item.project.id,
            parent_id: item.id,
            [params.name]: input,
        };
        if (params.method === "PUT") {
            sendData = {
                id: item.id,
                description: input,
            };
        }
        redmine(sendData, params.method);
        setOpen(false);
    };

    return (
        <div style={{ display: "none" }}>
            <Dialog open={open} onClose={handleClose} maxWidth={params.maxWidth} fullWidth={"fullWidth"}>
                <DialogTitle>{params.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <span style={{ wordBreak: "keep-all" }}>{params.subtitle}</span>
                    </DialogContentText>
                    <div style={{ display: "flex", width: "100%" }}>
                        <TextField
                            autoFocus={true}
                            margin="dense"
                            name={params.name}
                            label={"Enter the " + params.name}
                            type="text"
                            fullWidth
                            multiline={params.multiline}
                            rows={params.multiline ? 16 : 1} //multのときは12行
                            variant="outlined"
                            value={input}
                            onChange={handleChange}
                            style={{ flex: 1 }}
                        />
                        {/* {params.name === "description" && <span dangerouslySetInnerHTML={{ __html: marked(input ? input : "") }} style={styleMDPreview} />} */}
                        {params.name === "description" && <StyleMarkdownSpan dangerouslySetInnerHTML={{ __html: renderMD(input ? input : "") }} />}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button color="primary" variant="contained" onClick={handleSubmit}>
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
});

/** 説明欄のPOP表示 ：TextFieldから呼び出し */
function MouseOverPopover(props) {
    const { textBody, anchorEl, handlePopoverClose } = props;
    const open = Boolean(anchorEl);

    return (
        <Popover
            style={{
                pointerEvents: "none",
            }}
            open={open}
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "left",
            }}
            onClose={handlePopoverClose}
        >
            <div style={{ padding: 1, backgroundColor: "transparent", zIndex: 5000 }}>
                <StyleMarkdownSpan dangerouslySetInnerHTML={{ __html: renderMD(textBody ? textBody : "No description") }} />
            </div>
        </Popover>
    );
}

/** Issue行の */
const CardList = React.memo(({ items, search_id, redmine, statuses, node = 0, issueFilter }) => {
    // console.log(items, issueFilter, search_id);
    const isDisplay = (item) => {
        console.log(issueFilter, item);
        let result = true;
        // toggle on
        if ("user" in issueFilter) result = item.assigned_to.id === issueFilter.user ? result : false;
        if ("status" in issueFilter) result = item.status.id === issueFilter.status || issueFilter.status === false ? result : false;

        if ("is_closed" in issueFilter) {
            // console.log(item.status.id);
            // console.log(statuses)
            if (issueFilter.is_closed) {
                result =
                    statuses
                        .filter((s) => s.is_closed === false)
                        .map((s) => s.id)
                        .indexOf(item.status.id) >= 0
                        ? result
                        : false;
            }

            // result = (item.status.id in statuses.filter(sts=>sts.is_close)).length > 0
        } else {
            result =
                statuses
                    .filter((s) => s.is_closed === false)
                    .map((s) => s.id)
                    .indexOf(item.status.id) >= 0
                    ? result
                    : false;
        }
        // console.log(statuses);
        // console.log(result, item)
        return result;
    };
    // console.log(items)
    return (
        <ul style={{ width: "100%", maxWidth: "1200px", padding: "0" }}>
            {/* project */}
            {items
                .map((x) => x.project.id)
                .filter((x, i, self) => self.indexOf(x) === i) // 重複削除
                .map((prj) => (
                    <React.Fragment>
                        {/* issues */}
                        {items
                            .filter((x) => x.project.id === prj)
                            .filter((x) => ("parent" in x ? x.parent.id : undefined) === search_id)
                            .map((item, index) => (
                                <React.Fragment>
                                    {index === 0 && node === 0 && <p style={{ padding: "0 4px", fontSize: "large", fontWeight: "Bold", color: "#4866a8" }}>{item.project.name}</p>}
                                    <StyleLi key={index} style={{}}>
                                        <div
                                            style={{ paddingLeft: 20 * node, display: isDisplay(item) ? "" : "none", width: 1000 - node * 20, backgroundColor: item.status.id === 9 ? "#EFEFEF" : "" }}
                                        >
                                            {/* IssueID 表示とリンク */}
                                            <div>
                                                <a href={"./issues/" + item.id} target="_blank">
                                                    #{item.id}
                                                </a>
                                                <TitleField item={item} handleSubmit={redmine} method="PUT" />
                                            </div>
                                            <section>
                                                <MenuButton item={item} redmine={redmine} /> {/* メニューボタン */}
                                                <div className="username">{"assigned_to" in item ? item.assigned_to.name : ""}</div>
                                                <SimpleSelect2 handleSubmit={redmine} items={statuses} issue={item} label="status_id" className="statuses" />
                                                <DateField name="start_date" item={item} handleSubmit={redmine} method="PUT" />
                                                <DateField name="due_date" item={item} handleSubmit={redmine} method="PUT" />
                                            </section>
                                        </div>
                                        <MouseOverPopover textBody={"TETST"} />
                                        <CardList items={items} search_id={item.id} redmine={redmine} statuses={statuses} node={node + 1} issueFilter={issueFilter} />
                                    </StyleLi>
                                </React.Fragment>
                            ))}
                        {items
                            .filter((x) => x.project.id === prj)
                            .filter((x) => ("parent" in x ? x.parent.id : undefined) === search_id)
                            .filter((x) => isDisplay(x)).length > 0 && (
                                <StyleLi className="newitem incard" style={{ paddingLeft: 20 * node - 18 }}>
                                    <NewTextInputLine project_id={prj} parent_id={search_id} redmine={redmine} />
                                </StyleLi>
                            )}
                    </React.Fragment>
                ))}
        </ul>
    );
});

const NewTextInputLine = React.memo((props) => {
    const [expand, setExpand] = useState(undefined);
    const enableExpand = () => {
        setExpand({
            subject: "",
            project: { id: props.project_id },
            parent: { id: props.parent_id },
        });
    };
    const disableExpand = () => {
        setExpand(undefined);
        console.log(expand);
    };

    return (
        <div onBlur={disableExpand}>
            <InsertButtonGroup>
                {!expand && (
                    <div color="primary" variant="outlined" onClick={() => enableExpand(1)}>
                        ————— ＋insert {props.search_id} —————
                    </div>
                )}
                {expand && <TitleField item={expand} handleSubmit={props.redmine} method="POST" />}
            </InsertButtonGroup>
        </div>
    );
});

const InsertButtonGroup = styled.div`
  width: 600px;
  margin-left: 20px;
  /* margin: 0 auto; */
  div {
    display: flex;
    justify-content: left;
    opacity: 0;
    font-size: 10px;
    color: transparent;
    border: transparent;
    &:hover {
      position: relative;
      background-color: #aaaaff50;
      opacity: 0.8;
      color: blue;
    }
  }
`;

const TitleField = React.memo((props) => {
    const [subject, setSubject] = useState("");

    useEffect(() => {
        setSubject(props.item.subject);
    }, [props.item]);

    /** テキスト入力時イベント */
    const handleChange = (e) => {
        // console.log(e.target.name + ":" + e.target.value);
        setSubject(e.target.value);
        // setFormVal({ ...formVal, [e.target.name]: e.target.value });
    };

    /** 入力終了イベント */
    const handleSubmit = () => {
        props.handleSubmit(
            {
                id: props.item.id,
                project_id: props.item.project.id,
                parent_id: "parent" in props.item ? props.item.parent.id : "",
                subject: subject,
            },
            props.method
        );
        setSubject("");
    };

    // POP表示用
    const [anchorEl, setAnchorEl] = React.useState(null);
    const handlePopoverOpen = (event) => {
        console.log(event.currentTarget);
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        console.log("close");
        setAnchorEl(null);
    };


    return (
        <div>
            <TextField
                name="subject"
                id={"test" + props.item.id}
                onChange={(e) => handleChange(e)}
                onKeyPress={(e) => {
                    if (e.key === "Enter") {
                        handleSubmit();
                    }
                }}
                title={subject}
                value={subject}
                InputLabelProps={{
                    style: { color: "#AAF" },
                }}
                fullWidth
                autoFocus={props.method === "POST" ? true : false} // 新規追加のみautoFocusを有効にする
                style={{ background: props.item.subject === subject ? "" : "yellow" }}
            />
            <i class="fa-solid fa-circle-info" onMouseEnter={handlePopoverOpen} onMouseLeave={handlePopoverClose}></i>
            <MouseOverPopover textBody={props.item.description} itemId={"test" + props.item.id} anchorEl={anchorEl} handlePopoverClose={handlePopoverClose} />
        </div>
    );
});

const DateField = React.memo((props) => {
    // const {subject} = props
    const [dateval, setDateval] = useState("");

    useEffect(() => {
        setDateval(props.item[props.name]);
    }, [props.item[props.name]]);

    /** テキスト入力時イベント */
    const handleChange = (e) => {
        console.log(e.target.name + ":" + e.target.value);
        setDateval(e.target.value);
        const formData = {
            id: props.item.id,
            [props.name]: e.target.value,
        };
        console.log(formData);
        props.handleSubmit(formData, "PUT");
    };

    return (
        <TextField
            name={props.name}
            type="date"
            variant="outlined"
            onChange={(e) => handleChange(e)}
            value={dateval}
            InputLabelProps={{
                style: { color: "#AAF" },
            }}
            style={{ paddingLeft: 0 }}
        // style={{ background: props.item.subject === subject ? "" : "yellow", width: "400px" }}
        />
    );
});

// yarn json-server db.json --routes routes.json --watch
ReactDOM.render(<App />, document.getElementById("content"));
