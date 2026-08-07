"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";

function DialogRoot(props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogBackdrop({ className, ...props }) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn("ops-linelist-backdrop", className)}
      {...props}
    />
  );
}

function DialogPopup({ className, ...props }) {
  return (
    <DialogPrimitive.Popup
      data-slot="dialog-popup"
      className={cn("ops-linelist-popup", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("ops-linelist__title", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("ops-linelist__count", className)}
      {...props}
    />
  );
}

function DialogClose({ className, children = "Close", ...props }) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      render={<button className={cn("ops-linelist__close", className)} type="button" />}
      {...props}
    >
      {children}
    </DialogPrimitive.Close>
  );
}

const Dialog = Object.freeze({
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Backdrop: DialogBackdrop,
  Popup: DialogPopup,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
});

export {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
};
