import { createTheme } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "green",
  colors: {
    green: [
      "#f0f5f0",
      "#e8f0e8",
      "#c8d9c8",
      "#a8c2a8",
      "#88ab88",
      "#5B8C5A",
      "#4A7C49",
      "#3a6c39",
      "#2a5c29",
      "#1a4c19",
    ],
  },
  fontFamily: "Inter, system-ui, sans-serif",
  defaultRadius: "md",
  components: {
    Button: { defaultProps: { radius: "md" } },
    Card: { defaultProps: { radius: "md" } },
    TextInput: { defaultProps: { radius: "md" } },
    PasswordInput: { defaultProps: { radius: "md" } },
    Textarea: { defaultProps: { radius: "md" } },
    Select: { defaultProps: { radius: "md" } },
  },
});
