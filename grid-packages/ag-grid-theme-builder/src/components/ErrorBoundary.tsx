import styled from '@emotion/styled';
import { Component, PropsWithChildren } from 'react';

type ErrorBoundaryState = {
  errorMessage?: string;
};

// false positive
// eslint-disable-next-line react-refresh/only-export-components
const ErrorDisplay = styled('div')`
  background-color: #fcc;
  color: #800;
  padding: 10px;
  border: solid 1px #800;
`;

export class ErrorBoundary extends Component<PropsWithChildren> {
  state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const message = error?.message;
    return { errorMessage: message ? `Error: ${message}` : String(error) };
  }

  render() {
    if (this.state.errorMessage) {
      // You can render any custom fallback UI
      return <ErrorDisplay>{this.state.errorMessage}</ErrorDisplay>;
    }

    return this.props.children;
  }
}

export function withErrorBoundary<T>(component: React.FC<T>): React.FC<T> {
  const ChildComponent = component;
  const wrapper: React.FC<T> = (props) => (
    <ErrorBoundary>
      <ChildComponent key={undefined} {...props} />
    </ErrorBoundary>
  );
  wrapper.displayName = `withErrorBoundary(${component.displayName || component.name})`;
  return wrapper;
}
