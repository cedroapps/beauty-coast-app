package com.beautycoast.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "appointments")
@Data 
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String clientName;      // Nome da cliente (ex: Maria Fernanda)
    private String serviceType;     // Tipo (Noiva, Social, Formanda)
    private LocalDateTime dateTime; // Data e Hora
    private Double price;           // Valor cobrado
    private String status;          // Agendado, Concluído, Cancelado
}