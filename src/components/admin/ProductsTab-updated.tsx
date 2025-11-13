<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="product-form-description">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
              <p id="product-form-description" className="text-sm text-muted-foreground">
                Fill in the product details below. Fields marked with * are required.
              </p>
            </DialogHeader>
