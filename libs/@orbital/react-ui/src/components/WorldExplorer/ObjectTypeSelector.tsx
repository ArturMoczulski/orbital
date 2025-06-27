import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useEffect } from "react";
import { ObjectType, useObjectType } from "../../contexts/ObjectTypeContext";

export interface ObjectTypeSelectorProps {
  label?: string;
  objectTypes?: { type: ObjectType; label: string }[];
  disabled?: boolean;
}

export default function ObjectTypeSelector({
  label = "Object Type",
  objectTypes = [],
  disabled = false,
}: ObjectTypeSelectorProps) {
  const { objectType, setObjectType } = useObjectType();

  // Set default object type if none is selected
  useEffect(() => {
    if (!objectType && objectTypes.length > 0) {
      setObjectType(objectTypes[0].type);
    }
  }, [objectType, objectTypes, setObjectType]);

  const handleChange = (event: SelectChangeEvent) => {
    setObjectType(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="object-type-selector-label">{label}</InputLabel>
        <Select
          labelId="object-type-selector-label"
          id="object-type-selector"
          value={objectType || ""}
          label={label}
          onChange={handleChange}
          disabled={disabled || objectTypes.length === 0}
          data-testid="object-type-selector"
          data-cy="object-type-selector"
        >
          {objectTypes.map((item) => (
            <MenuItem key={item.type} value={item.type}>
              {item.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
