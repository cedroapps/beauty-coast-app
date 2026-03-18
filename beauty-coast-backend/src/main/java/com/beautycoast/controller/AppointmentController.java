package com.beautycoast.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.beautycoast.model.Appointment;
import com.beautycoast.repository.AppointmentRepository;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*") // Importante para o celular conseguir ler
public class AppointmentController {

    @Autowired
    private AppointmentRepository repository;

    @GetMapping
    public List<Appointment> listar() {
        return repository.findAll();
    }

    @PostMapping
    public Appointment criar(@RequestBody Appointment appointment) {
        return repository.save(appointment);
    }
}