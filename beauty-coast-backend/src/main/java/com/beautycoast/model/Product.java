package com.beautycoast.model;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "products")
@Data 
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;           // Nome do produto (ex: Forever Skin Glow)
    private String brand;          // Marca (ex: Dior)
    private String category;       // Categoria (ex: Base)
    private BigDecimal price;      // Preço
    private Double volume;         // Ex: 30.0
    private String unit;           // ml ou gramas
    private Integer estimatedUses; // Rendimento estimado
}