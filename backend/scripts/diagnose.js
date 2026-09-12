const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const diagnose = async () => {
  let connection;

  try {
    console.log('=== DIAGNÓSTICO TIGRE BURGER POS ===\n');

    // 1. Test connection
    console.log('1. Probando conexión a MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    console.log('   ✅ Conexión exitosa\n');

    // 2. Check database
    console.log('2. Verificando base de datos...');
    const [dbs] = await connection.query('SHOW DATABASES LIKE "tigre_burger_pos"');
    if (dbs.length === 0) {
      console.log('   ❌ Base de datos tigre_burger_pos no existe');
      console.log('   Creando base de datos...');
      await connection.query('CREATE DATABASE tigre_burger_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('   ✅ Base de datos creada\n');
    } else {
      console.log('   ✅ Base de datos existe\n');
    }

    await connection.query('USE tigre_burger_pos');

    // 3. Check tables
    console.log('3. Verificando tablas...');
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('   Tablas encontradas:', tableNames.join(', ') || 'NINGUNA');

    if (tableNames.length === 0) {
      console.log('   ❌ No hay tablas. Ejecutando schema...');
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
      let schema = fs.readFileSync(schemaPath, 'utf8');

      // Remove comment lines (-- comments)
      schema = schema.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');

      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (e) {
          if (e.code !== 'ER_DUP_ENTRY') {
            console.log('   Error ejecutando:', e.message);
          }
        }
      }
      console.log('   ✅ Tablas creadas\n');
    } else {
      console.log('   ✅ Tablas existen\n');
    }

    // 4. Check roles
    console.log('4. Verificando roles...');
    const [roles] = await connection.query('SELECT * FROM roles');
    if (roles.length === 0) {
      console.log('   ❌ No hay roles. Creando...');
      await connection.query("INSERT INTO roles (name, description) VALUES ('admin', 'Administrador')");
      await connection.query("INSERT INTO roles (name, description) VALUES ('cajero', 'Cajero')");
      console.log('   ✅ Roles creados');
    } else {
      console.log('   ✅ Roles:', roles.map(r => r.name).join(', '));
    }
    console.log('');

    // 5. Check users
    console.log('5. Verificando usuarios...');
    const [users] = await connection.query('SELECT u.id, u.username, u.status, r.name as role FROM usuarios u JOIN roles r ON u.role_id = r.id');

    if (users.length === 0) {
      console.log('   ❌ No hay usuarios. Creando...');
      const adminHash = await bcrypt.hash('admin123', 10);
      const cajeroHash = await bcrypt.hash('cajero123', 10);

      const [adminRole] = await connection.query("SELECT id FROM roles WHERE name = 'admin'");
      const [cajeroRole] = await connection.query("SELECT id FROM roles WHERE name = 'cajero'");

      await connection.query(
        'INSERT INTO usuarios (username, password, full_name, role_id, status) VALUES (?, ?, ?, ?, ?)',
        ['admin', adminHash, 'Administrador', adminRole[0].id, 'activo']
      );
      await connection.query(
        'INSERT INTO usuarios (username, password, full_name, role_id, status) VALUES (?, ?, ?, ?, ?)',
        ['cajero', cajeroHash, 'Cajero Principal', cajeroRole[0].id, 'activo']
      );
      console.log('   ✅ Usuarios creados');
    } else {
      console.log('   ✅ Usuarios encontrados:');
      users.forEach(u => console.log(`      - ${u.username} (${u.role}) - ${u.status}`));
    }
    console.log('');

    // 6. Verify passwords
    console.log('6. Verificando contraseñas...');
    const [allUsers] = await connection.query(
      'SELECT u.username, u.password, r.name as role FROM usuarios u JOIN roles r ON u.role_id = r.id'
    );

    for (const user of allUsers) {
      const testPass = user.role === 'admin' ? 'admin123' : 'cajero123';
      const valid = await bcrypt.compare(testPass, user.password);
      console.log(`   ${user.username}: ${valid ? '✅ Contraseña válida' : '❌ Contraseña inválida'}`);

      if (!valid) {
        console.log(`   Corrigiendo contraseña para ${user.username}...`);
        const newHash = await bcrypt.hash(testPass, 10);
        await connection.query('UPDATE usuarios SET password = ? WHERE username = ?', [newHash, user.username]);
        console.log(`   ✅ Contraseña corregida`);
      }
    }

    console.log('\n=== DIAGNÓSTICO COMPLETO ===');
    console.log('\nCredenciales para login:');
    console.log('  Admin:  admin / admin123');
    console.log('  Cajero: cajero / cajero123');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Verifique su archivo .env y que MySQL esté ejecutándose');
  } finally {
    if (connection) await connection.end();
  }
};

diagnose();
