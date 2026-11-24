import { Fragment, useState, type FormEvent } from "react";
import { Box, Button, Card, Flex, Heading, Input, Text } from "theme-ui";
import { type Project, errorMessage, useCreateTodo, useProjects } from "../api";
import { Meter } from "../components/Meter";
import { TodoDialog } from "../todos/TodoDialog";
import { TodoRow } from "../todos/TodoRow";
import { ProjectDialog } from "./ProjectDialog";

export function Portfolio() {
  const projects = useProjects();
  const [adding, setAdding] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [todoId, setTodoId] = useState<string | null>(null);

  if (projects.isError) return <Text role="alert">Couldn't load your projects. Is the API running?</Text>;
  if (!projects.data) return <Text>Loading…</Text>;

  const editing = projects.data.find((p) => p.id === projectId);
  const todo = projects.data.flatMap((p) => p.todos).find((t) => t.id === todoId);

  return (
    <Flex sx={{ flexDirection: "column", gap: 5 }}>
      <Flex sx={{ justifyContent: "space-between", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
        <Heading as="h1" sx={{ fontSize: 5 }}>Portfolio</Heading>
        <Button onClick={() => setAdding(true)}>Add project</Button>
      </Flex>

      {projects.data.length === 0 && (
        <Card><Text>No projects yet. Add one from your portfolio site, then list what you want to improve.</Text></Card>
      )}
      {projects.data.map((p) => (
        <ProjectCard key={p.id} project={p} onEdit={() => setProjectId(p.id)} onOpenTodo={setTodoId} />
      ))}

      {adding && <ProjectDialog onClose={() => setAdding(false)} />}
      {editing && <ProjectDialog key={editing.id} project={editing} onClose={() => setProjectId(null)} />}
      {todo && <TodoDialog key={todo.id} todo={todo} onClose={() => setTodoId(null)} />}
    </Flex>
  );
}

interface CardProps {
  project: Project;
  onEdit: () => void;
  onOpenTodo: (id: string) => void;
}

function ProjectCard({ project: p, onEdit, onOpenTodo }: CardProps) {
  const open = p.todos.filter((t) => !t.completedAt);
  const done = p.todos
    .filter((t) => t.completedAt)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));
  const links = [{ label: "Live site", url: p.liveUrl }, { label: "Repository", url: p.repoUrl }].filter((l) => l.url);
  const rows = (items: typeof open) =>
    items.map((t) => <TodoRow key={t.id} todo={t} inProject onOpen={() => onOpenTodo(t.id)} />);

  return (
    <Card as="section" aria-labelledby={`project-${p.id}`} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Flex sx={{ justifyContent: "space-between", alignItems: "start", gap: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Heading as="h2" id={`project-${p.id}`} sx={{ fontSize: 3 }}>{p.name}</Heading>
          {links.length > 0 && (
            <Text variant="meta">
              {links.map((l, i) => (
                <Fragment key={l.label}>
                  {i > 0 && " · "}
                  <a href={l.url!} target="_blank" rel="noreferrer">{l.label}</a>
                </Fragment>
              ))}
            </Text>
          )}
        </Box>
        <Button variant="ghost" aria-label={`Edit ${p.name}`} onClick={onEdit}>Edit</Button>
      </Flex>

      {p.notes && <Text sx={{ whiteSpace: "pre-wrap" }}>{p.notes}</Text>}

      {p.todos.length > 0 && (
        <Box>
          <Text sx={{ display: "block", mb: 2 }}>{done.length} of {p.todos.length} improvements done</Text>
          <Meter value={done.length} max={p.todos.length} label={`${p.name} improvements done`} />
        </Box>
      )}

      {open.length > 0 && <Box as="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>{rows(open)}</Box>}
      <AddImprovement project={p} />

      {done.length > 0 && (
        <details>
          <Box as="summary" sx={{ cursor: "pointer", color: "secondary", "&:focus-visible": { outline: "2px solid", outlineColor: "accent" } }}>
            Done ({done.length})
          </Box>
          <Box as="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 2 }}>{rows(done)}</Box>
        </details>
      )}
    </Card>
  );
}

function AddImprovement({ project }: { project: Project }) {
  const create = useCreateTodo();
  const [title, setTitle] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ title, projectId: project.id }, { onSuccess: () => setTitle("") });
  }

  return (
    <Box as="form" onSubmit={submit}>
      <Flex sx={{ gap: 2 }}>
        <Input
          required
          aria-label={`Add an improvement to ${project.name}`}
          placeholder="Add an improvement"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button type="submit" variant="secondary" disabled={create.isPending}>Add</Button>
      </Flex>
      {create.isError && <Text role="alert" sx={{ color: "alert" }}>{errorMessage(create.error)}</Text>}
    </Box>
  );
}
