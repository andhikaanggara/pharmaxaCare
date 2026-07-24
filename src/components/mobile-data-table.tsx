import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { cn } from "@/lib/utils";

type MobileDataTableProps = {
  title: string;
  description?: string | null;
  action?: string;
  onEdit: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
  showOnTablet?: boolean;
};

export function MobileDataTable({
  title,
  description,
  action,
  onEdit,
  onDelete,
  children,
  showOnTablet,
}: MobileDataTableProps) {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
          {action && (
            <CardAction>
              <Badge variant="default">{action}</Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="flex gap-2">
          <Button className="w-1/2" variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button className="w-1/2" variant="destructive" onClick={onDelete}>
            Hapus
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
