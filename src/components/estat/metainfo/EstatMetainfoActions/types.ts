export interface ActionsProps {
  onRefresh: () => void;
  onRetry?: () => void;
  hasError?: boolean;
}
