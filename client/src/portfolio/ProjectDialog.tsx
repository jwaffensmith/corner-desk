import { useState, type FormEvent } from "react";
import { Box, Button, Flex, Input, Label, Text } from "theme-ui";
import { type Project, errorMessage, useCreateProject, useDeleteProject, useUpdateProject } from "../api";
import { Dialog } from "../components/Dialog";
import { TextArea } from "../components/TextArea";

export function ProjectDialog({ project, onClose }: { project?: Project; onClose: () => void }) {
  const create = useCreateProject();
  const update = useUpdateProject();
  const remove = useDeleteProject();
  const [name, setName] = useState(project?.name ?? "");
  const [liveUrl, setLiveUrl] = useState(project?.liveUrl ?? "");
  const [repoUrl, setRepoUrl] = useState(project?.repoUrl ?? "");
  const [notes, setNotes] = useState(project?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const body = { name, liveUrl: liveUrl.trim() || null, repoUrl: repoUrl.trim() || null, notes: notes || null };
    try {
      await (project ? update.mutateAsync({ id: project.id, ...body }) : create.mutateAsync(body));
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function confirmDelete(p: Project) {
    const count = p.todos.length;
    const improvements = count === 0 ? "" : count === 1 ? " and its 1 improvement" : ` and its ${count} improvements`;
    if (window.confirm(`Delete "${p.name}"${improvements}?`)) remove.mutateAsync(p.id).then(onClose);
  }

  return (
    <Dialog title={project ? "Edit project" : "Add project"} onClose={onClose}>
      <Flex as="form" onSubmit={submit} sx={{ flexDirection: "column", gap: 3 }}>
        <Box>
          <Label htmlFor="p-name">Project</Label>
          <Input id="p-name" required autoFocus={!project} value={name} onChange={(e) => setName(e.target.value)} />
        </Box>
        <Box>
          <Label htmlFor="p-live">Live site (optional)</Label>
          <Input id="p-live" type="url" placeholder="https://" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />
        </Box>
        <Box>
          <Label htmlFor="p-repo">Repository (optional)</Label>
          <Input id="p-repo" type="url" placeholder="https://" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
        </Box>
        <Box>
          <Label htmlFor="p-notes">Notes (optional)</Label>
          <TextArea id="p-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Box>
        {error && <Text role="alert" sx={{ color: "alert" }}>{error}</Text>}
        <Flex sx={{ gap: 2 }}>
          <Button type="submit">{project ? "Save" : "Add"}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          {project && (
            <Button type="button" variant="ghost" sx={{ ml: "auto" }} onClick={() => confirmDelete(project)}>Delete</Button>
          )}
        </Flex>
      </Flex>
    </Dialog>
  );
}
