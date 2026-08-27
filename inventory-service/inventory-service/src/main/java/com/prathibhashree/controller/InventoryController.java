package com.prathibhashree.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private static final Logger logger =
            LoggerFactory.getLogger(InventoryController.class);

    @GetMapping("/{product}")
    public String checkStock(@PathVariable String product) {

        logger.info("Checking stock for product: {}", product);

        if (product.equalsIgnoreCase("unknown")) {
            logger.warn("Product not found in inventory: {}", product);
            return "Product not found: " + product;
        }

        logger.info("Stock available for product: {}", product);

        return "Stock available for: " + product;
    }

    @PostMapping("/{product}")
    public String updateStock(
            @PathVariable String product,
            @RequestParam int quantity) {

        logger.info("Updating stock for product: {} by quantity: {}",
                product, quantity);

        if (quantity <= 0) {
            logger.error("Invalid stock quantity for product: {}", product);
            return "Stock update failed: quantity must be greater than 0";
        }

        if (quantity < 3) {
            logger.warn("Low stock quantity for product: {}. Remaining: {}",
                    product, quantity);
        }

        logger.info("Stock updated successfully for product: {}", product);

        return "Stock updated for " + product +
                ". Quantity: " + quantity;
    }
}