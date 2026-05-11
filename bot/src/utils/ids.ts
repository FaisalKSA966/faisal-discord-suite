// Stable namespacing for custom_ids of buttons / selects / modals.
// Format: "ns:action:arg1:arg2"
export const IDS = {
  setup: {
    open: "setup:open",
    selectRecordChannel: "setup:rec_channel",
    selectPinChannel: "setup:pin_channel",
    selectDefaultDuration: "setup:default_duration",
    selectRegion: "setup:region",
    toggleAutoPin: "setup:toggle_pin",
    toggleAutoRegion: "setup:toggle_region",
    close: "setup:close",
  },
  record: {
    start: "rec:start",
    stop: "rec:stop",
    clip5: "rec:clip:5",
    clip10: "rec:clip:10",
    clip30: "rec:clip:30",
    clipCustom: "rec:clip:custom",
    openSettings: "rec:open_settings",
  },
  editor: {
    trimStart: "edit:trim_start",
    trimEnd: "edit:trim_end",
    userToggle: "edit:user_toggle", // followed by :userId
    userVolume: "edit:user_volume",
    shareVolume: "edit:share_volume",
    render: "edit:render",
    rename: "edit:rename",
  },
  xo: {
    join: "xo:join",
    cell: "xo:cell", // followed by :index
    cancel: "xo:cancel",
  },
  soundboard: {
    record: "sb:record",
    stop: "sb:stop",
    preview: "sb:preview",
    save: "sb:save",
    discard: "sb:discard",
    modal: "sb:modal",
  },
} as const;

export function parseId(id: string): { ns: string; action: string; args: string[] } {
  const parts = id.split(":");
  return {
    ns: parts[0] ?? "",
    action: parts[1] ?? "",
    args: parts.slice(2),
  };
}
