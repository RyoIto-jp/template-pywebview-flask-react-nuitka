import React from 'react'
import { MenuItem, FormControl, InputLabel, Select } from "@material-ui/core";


const SimpleSelect = (props) => {
  // console.log(props)
  const { name: selectName, handleChange, val, initialValue } = props;
  const options = props.options ? props.options : ""

  return (
    <FormControl style={{ width: '100%' }}>
      <InputLabel id={'label-select-${props.name}'}>{selectName}</InputLabel>
      <Select
        labelId="select-label"
        id="simple-select"
        name={selectName}
        value={val[selectName]}
        label={selectName}
        onChange={handleChange}
        variant="outlined"
        color="primary"
        defaultValue=""
      >
        {options.map((option) => (
          <MenuItem value={option.value} key={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default SimpleSelect