"use client";

import * as React from "react";
import { ToastActionElement, type ToastProps } from "./toast";

const TOAST_LIMIT = 6;
const TOAST_REMOVE_DELAY = 1000;

type ToasterToast = ToastProps;

type ActionType =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: ToasterToast["id"] }
  | { type: "REMOVE_TOAST"; toastId?: ToasterToast["id"] };

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: ToastProps[], action: ActionType): ToastProps[] => {
  switch (action.type) {
    case "ADD_TOAST": {
      return [action.toast, ...state].slice(0, TOAST_LIMIT);
    }
    case "UPDATE_TOAST": {
      return state.map((toast) => (toast.id === action.toast.id ? { ...toast, ...action.toast } : toast));
    }
    case "DISMISS_TOAST": {
      const toastId = action.toastId;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return state.map((toast) =>
        toast.id === toastId || toastId === undefined ? { ...toast, open: false } : toast,
      );
    }
    case "REMOVE_TOAST": {
      if (action.toastId === undefined) {
        return [];
      }
      return state.filter((toast) => toast.id !== action.toastId);
    }
    default:
      return state;
  }
};

const listeners: Array<(state: ToastProps[]) => void> = [];
let memoryState: ToastProps[] = [];

function dispatch(action: ActionType) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

export function toast({ ...props }: Omit<ToastProps, "id">) {
  const id = crypto.randomUUID();

  const update = (props: ToastProps) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

export function useToast() {
  const [state, setState] = React.useState<ToastProps[]>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state.reduce(
      (acc, toast) => ({
        ...acc,
        [toast.id]: toast,
      }),
      {},
    ),
    toasts: state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export type { ToastActionElement, ToastProps };
