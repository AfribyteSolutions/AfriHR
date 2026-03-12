import React from "react";
import {
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  Box,
  SelectChangeEvent,
} from "@mui/material";
import Image from "next/image";

interface IMultiSelectWithImageProps<T> {
  data: T[];
  selectedValues: T[];
  valueKey: keyof T;
  displayKey: keyof T;
  imageKey: keyof T;
  placeholder?: string;
  onChange: (selected: T[]) => void;
}

const MAX_VISIBLE_CHIPS = 2;

function MultiSelectWithImage<T extends Record<string, any>>({
  data,
  selectedValues,
  valueKey,
  displayKey,
  imageKey,
  placeholder = "Select options",
  onChange,
}: IMultiSelectWithImageProps<T>) {
  const selectedIds = selectedValues.map((item) => String(item[valueKey]));

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const values = event.target.value as string[];
    const selected = data.filter((item) =>
      values.includes(String(item[valueKey]))
    );
    onChange(selected);
  };

  const handleDelete = (valueToRemove: string) => {
    const updated = selectedValues.filter(
      (item) => String(item[valueKey]) !== valueToRemove
    );
    onChange(updated);
  };

  const visibleItems = selectedValues.slice(0, MAX_VISIBLE_CHIPS);
  const hiddenCount = selectedValues.length - MAX_VISIBLE_CHIPS;

  return (
    <FormControl sx={{ m: 0, width: "100%" }} size="small">
      <Select
        multiple
        displayEmpty
        value={selectedIds}
        onChange={handleChange}
        sx={{
          height: 44,
          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 32px 6px 12px !important",
            overflow: "hidden",
          },
        }}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return <span className="text-gray-400">{placeholder}</span>;
          }
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, overflow: "hidden" }}>
              {visibleItems.map((item) => (
                <Chip
                  key={String(item[valueKey])}
                  label={String(item[displayKey])}
                  size="small"
                  onDelete={() => handleDelete(String(item[valueKey]))}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{ height: 24, fontSize: "0.75rem", maxWidth: 130 }}
                />
              ))}
              {hiddenCount > 0 && (
                <Chip
                  label={`+${hiddenCount} more`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 24, fontSize: "0.75rem" }}
                />
              )}
            </Box>
          );
        }}
        MenuProps={{
          disableScrollLock: true,
          PaperProps: { style: { maxHeight: 300 } },
        }}
      >
        {data.map((item, index) => (
          <MenuItem key={index} value={String(item[valueKey])}>
            <Checkbox checked={selectedIds.includes(String(item[valueKey]))} />
            {item[imageKey] && (
              <Image
                src={String(item[imageKey])}
                alt={String(item[displayKey])}
                width={28}
                height={28}
                className="rounded-full mr-2"
              />
            )}
            <ListItemText primary={String(item[displayKey])} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default MultiSelectWithImage;
