import { useState } from "react";
import { Box, Button, Flex, Label, Text } from "theme-ui";
import { TextArea } from "../components/TextArea";
import { ApiError, type ImportResult, useImport } from "../api";
import { Dialog } from "../components/Dialog";

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const importer = useImport();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ImportResult["plan"] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function run(dryRun: boolean) {
    setErrors([]);
    let file: unknown;
    try {
      file = JSON.parse(text);
    } catch {
      setErrors(["That isn't valid JSON."]);
      return;
    }
    try {
      const result = await importer.mutateAsync({ file, dryRun });
      if (dryRun) setPreview(result.plan);
      else onClose();
    } catch (err) {
      const fields = err instanceof ApiError ? Object.entries(err.fields ?? {}) : [];
      setErrors(fields.length ? fields.map(([path, msg]) => `${path}: ${msg}`) : [(err as Error).message]);
    }
  }

  const edit = (value: string) => {
    setText(value);
    setPreview(null);
  };

  return (
    <Dialog title="Import curriculum" onClose={onClose}>
      <Text>
        Paste or choose a curriculum JSON file. Re-importing a plan updates content only; your
        progress, time, and notes are never changed. A backup file restores the progress saved in it.
      </Text>
      <Text>
        Writing your own? <a href="/curriculum.example.json" download>Download an example file</a> to start from.
      </Text>
      <Box>
        <Label htmlFor="import-file">Choose a file</Label>
        <input id="import-file" type="file" accept="application/json,.json" onChange={async (e) => edit((await e.target.files?.[0]?.text()) ?? "")} />
      </Box>
      <Box>
        <Label htmlFor="import-json">Curriculum JSON</Label>
        <TextArea id="import-json" rows={12} value={text} onChange={(e) => edit(e.target.value)} sx={{ fontFamily: "monospace", fontSize: 0 }} />
      </Box>

      {errors.length > 0 && (
        <Box role="alert" sx={{ color: "#88542C" }}>
          {errors.slice(0, 8).map((e) => <Text key={e} sx={{ display: "block" }}>{e}</Text>)}
          {errors.length > 8 && <Text>…and {errors.length - 8} more</Text>}
        </Box>
      )}

      {preview && (
        <Box aria-live="polite" sx={{ bg: "muted", p: 3, borderRadius: "sm" }}>
          <Text variant="label">This import will</Text>
          <Box as="ul" sx={{ pl: 4, my: 1 }}>
            {preview.tracks.create.length > 0 && <li>Add {preview.tracks.create.length} learning tracks</li>}
            <li>Add {preview.weeks.create.length} weeks and update {preview.weeks.update.length}</li>
            <li>Add {preview.assignments.create.length} assignments and update {preview.assignments.update.length}</li>
            <li>Remove {preview.assignments.remove.length} untouched assignments no longer in the file</li>
            {preview.assignments.keep.length > 0 && (
              <li>Keep {preview.assignments.keep.length} dropped assignments because they have progress</li>
            )}
            {preview.restoresProgress > 0 && (
              <li>Restore saved progress on {preview.restoresProgress} assignments, replacing what's there now</li>
            )}
            {preview.settings && <li>Update your targets</li>}
          </Box>
        </Box>
      )}

      <Flex sx={{ gap: 2 }}>
        {preview ? (
          <Button disabled={importer.isPending} onClick={() => run(false)}>Import</Button>
        ) : (
          <Button disabled={!text.trim() || importer.isPending} onClick={() => run(true)}>Preview</Button>
        )}
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </Flex>
    </Dialog>
  );
}
