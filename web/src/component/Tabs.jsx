import React from 'react'
import { makeStyles, Paper, Tabs, Tab, Box } from "@material-ui/core";



const useStyles = makeStyles({
  root: {
    flexGrow: 1,
  },
  vertical: {
    display: "flex",
    gap: "20px",
    // flexGrow: 1,
  },
});


export const CenteredTabs = (props) => {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div>
      <Paper className={classes.root}>
        <Tabs value={value} onChange={handleChange} indicatorColor="primary" textColor="primary" centered>
          {props.labels.map((label, index) => (
            <Tab key={index} label={label}></Tab>
          ))}{" "}
          {/* さっきの */}
        </Tabs>
      </Paper>

      {/* 追加 */}
      {props.children.map((child, index) => (
        <TabPanel value={value} index={index} key={index}>
          {child}
        </TabPanel>
      ))}
    </div>
  );
}


export const VerticalTabs = (props) => {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className={classes.vertical}>
      <Paper style={{ backgroundColor: "#FAF5FA" }}>
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={value}
          onChange={handleChange}
          aria-label="Vertical tabs example"
          sx={{ borderRight: 1, borderColor: 'divider', backgroundColor: "#FFA" }}
        >
          {props.labels.map((label, index) => (
            <Tab label={label} key={index}></Tab>
          ))}{" "}
          {/* さっきの */}
        </Tabs>
      </Paper>

      {/* 追加 */}
      {props.children.map((child, index) => (
        <TabPanel value={value} index={index} key={index}>
          {child}
        </TabPanel>
      ))}
    </div>
  );
}


const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      key={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}
