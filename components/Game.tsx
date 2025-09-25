import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const PLAYER_HEIGHT = 1.8;
const PLAYER_SPEED = 5.0;
const PLAYER_JUMP_FORCE = 7.0;
const GRAVITY = -20.0;
const MAGAZINE_SIZE = 30;
const RELOAD_TIME = 2000;
const ENEMY_HEALTH = 50;
const TREE_HEALTH = 100;

interface GameProps {
  ammo: number;
  setAmmo: (ammo: number | ((prev: number) => number)) => void;
  reserveAmmo: number;
  setReserveAmmo: (ammo: number | ((prev: number) => number)) => void;
  isReloading: boolean;
  setIsReloading: (isReloading: boolean) => void;
  playerHealth: number;
  setPlayerHealth: (health: number | ((prev: number) => number)) => void;
}

interface Destructible {
    mesh: THREE.Object3D;
    health: number;
    takeDamage: (damage: number) => void;
}

interface Debris {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    rotationSpeed: THREE.Vector3;
    life: number;
}

class Enemy {
  mesh: THREE.Group;
  health: number = ENEMY_HEALTH;
  state: 'PATROL' | 'CHASE' = 'PATROL';
  patrolTarget: THREE.Vector3;
  
  constructor(position: THREE.Vector3) {
    this.mesh = createCharacterModel(new THREE.Color(0xff4444), false);
    this.mesh.position.copy(position);
    this.patrolTarget = this.getRandomPatrolPoint();
  }

  getRandomPatrolPoint() {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 80,
      0,
      (Math.random() - 0.5) * 80
    );
  }

  takeDamage(damage: number) {
      this.health -= damage;
      // Flash red
      const body = this.mesh.getObjectByName('body') as THREE.Mesh;
      if (body) {
        (body.material as THREE.MeshStandardMaterial).color.set(0xffffff);
        setTimeout(() => {
          (body.material as THREE.MeshStandardMaterial).color.set(0xff4444);
        }, 150);
      }
  }
}

const createCharacterModel = (color: THREE.Color, isPlayer: boolean) => {
    const group = new THREE.Group();

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), bodyMaterial);
    torso.position.y = 1.4;
    torso.name = "body";
    group.add(torso);

    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    head.position.y = 2.2;
    head.name = "head";
    group.add(head);

    // Legs
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 0.3), legMaterial);
    leftLeg.position.set(-0.2, 0.5, 0);
    leftLeg.name = "leftLeg";
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 0.3), legMaterial);
    rightLeg.position.set(0.2, 0.5, 0);
    rightLeg.name = "rightLeg";
    group.add(rightLeg);
    
    // Rifle (for player)
    if (isPlayer) {
        const rifle = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.15, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        rifle.position.set(0, 1.5, 0.5);
        rifle.name = "rifle";
        torso.add(rifle);
    }
    
    group.traverse(obj => {
        obj.castShadow = true;
        obj.receiveShadow = true;
    });
    
    return group;
}


export const Game: React.FC<GameProps> = ({ 
    setAmmo, ammo, reserveAmmo, setReserveAmmo, isReloading, setIsReloading, playerHealth, setPlayerHealth
}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const keys = useRef<{ [key: string]: boolean }>({}).current;
    const playerVelocity = useRef(new THREE.Vector3()).current;
    const onGround = useRef(true);
    const walkAnimationTime = useRef(0);

    useEffect(() => {
        if (!mountRef.current || playerHealth <= 0) return;

        // Scene, Renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);
        scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        mountRef.current.appendChild(renderer.domElement);
        
        // Camera (Third Person)
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const cameraOffset = new THREE.Vector3(0, 2, 4);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        
        // World & Obstacles
        const worldObjects: THREE.Object3D[] = [];
        const destructibles: Destructible[] = [];
        const debris: Debris[] = [];

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 50, 50),
            new THREE.MeshStandardMaterial({ color: 0x3d5e3a })
        );
        const positions = ground.geometry.attributes.position.array;
        for (let i = 2; i < positions.length; i += 3) {
            positions[i] = Math.random() * 0.5;
        }
        ground.geometry.computeVertexNormals();
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
        worldObjects.push(ground);

        for (let i = 0; i < 50; i++) {
            const isRock = Math.random() > 0.7;
            if (isRock) {
                const rockSize = Math.random() * 1.5 + 0.5;
                const rock = new THREE.Mesh(
                    new THREE.IcosahedronGeometry(rockSize, 0),
                    new THREE.MeshStandardMaterial({ color: 0x6c757d })
                );
                rock.position.set((Math.random() - 0.5) * 90, rockSize / 2, (Math.random() - 0.5) * 90);
                rock.castShadow = true;
                scene.add(rock);
                worldObjects.push(rock);
            } else {
                const treeHeight = Math.random() * 8 + 4;
                const trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.4, treeHeight, 8),
                    new THREE.MeshStandardMaterial({ color: 0x664422 })
                );
                trunk.position.set((Math.random() - 0.5) * 90, treeHeight / 2, (Math.random() - 0.5) * 90);
                trunk.castShadow = true;
                scene.add(trunk);
                worldObjects.push(trunk);
                const foliage = new THREE.Mesh(
                     new THREE.ConeGeometry(2, 4, 8),
                     new THREE.MeshStandardMaterial({ color: 0x228B22 })
                );
                foliage.position.y = treeHeight;
                trunk.add(foliage);

                const destructibleTree: Destructible = {
                    mesh: trunk,
                    health: TREE_HEALTH,
                    takeDamage: function(damage: number) {
                        this.health -= damage;
                        if (this.health <= 0) {
                            // Remove from world
                            scene.remove(this.mesh);
                            worldObjects.splice(worldObjects.indexOf(this.mesh), 1);
                            destructibles.splice(destructibles.indexOf(this), 1);
                            
                            // Create debris
                            for(let j = 0; j < 10; j++) {
                                const shard = new THREE.Mesh(
                                    new THREE.BoxGeometry(0.5, 0.5, 0.5),
                                    new THREE.MeshStandardMaterial({ color: 0x664422 })
                                );
                                shard.position.copy(this.mesh.position).add(new THREE.Vector3(
                                    (Math.random() - 0.5) * 2,
                                    (Math.random() - 0.5) * treeHeight,
                                    (Math.random() - 0.5) * 2
                                ));
                                scene.add(shard);
                                debris.push({
                                    mesh: shard,
                                    velocity: new THREE.Vector3(Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5).multiplyScalar(5),
                                    rotationSpeed: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(3),
                                    life: 3.0
                                });
                            }
                        }
                    }
                }
                destructibles.push(destructibleTree);
            }
        }
        
        const player = createCharacterModel(new THREE.Color(0x00ffc6), true);
        scene.add(player);

        const enemies: Enemy[] = [];
        for (let i = 0; i < 10; i++) {
            const enemy = new Enemy(new THREE.Vector3((Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80));
            scene.add(enemy.mesh);
            enemies.push(enemy);
        }
        
        let isCrouching = false;
        let isAiming = false;
        let mouseX = 0, mouseY = 0;

        const onKeyDown = (event: KeyboardEvent) => { keys[event.code] = true; };
        const onKeyUp = (event: KeyboardEvent) => { keys[event.code] = false; };
        const onMouseDown = (event: MouseEvent) => { 
            if (document.pointerLockElement) {
              if (event.button === 0) handleShoot();
              if (event.button === 2) isAiming = true;
            }
        };
        const onMouseUp = (event: MouseEvent) => {
             if (event.button === 2) isAiming = false;
        };
        const onMouseMove = (event: MouseEvent) => {
            if (document.pointerLockElement) {
                mouseX -= event.movementX * 0.002;
                mouseY -= event.movementY * 0.002;
                mouseY = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, mouseY));
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);
        
        const lockPointer = () => { renderer.domElement.requestPointerLock(); };
        renderer.domElement.addEventListener('click', lockPointer);

        const createRagdoll = (character: THREE.Group, impactDirection: THREE.Vector3) => {
            character.children.forEach(part => {
                if(part instanceof THREE.Mesh) {
                     const ragdollPart = part.clone();
                     // Attach to scene with world coordinates
                     const worldPos = new THREE.Vector3();
                     const worldQuat = new THREE.Quaternion();
                     part.getWorldPosition(worldPos);
                     part.getWorldQuaternion(worldQuat);
                     ragdollPart.position.copy(worldPos);
                     ragdollPart.quaternion.copy(worldQuat);
                     
                     scene.add(ragdollPart);
                     debris.push({
                         mesh: ragdollPart,
                         velocity: impactDirection.clone().multiplyScalar(2).add(new THREE.Vector3((Math.random()-0.5), Math.random(), (Math.random()-0.5)).multiplyScalar(3)),
                         rotationSpeed: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(5),
                         life: 5.0
                     });
                }
            });
            scene.remove(character);
        };


        const handleShoot = () => {
            if (isReloading || ammo <= 0) return;
            setAmmo(prev => prev - 1);
            
            const raycaster = new THREE.Raycaster();
            const aimDirection = new THREE.Vector3();
            camera.getWorldDirection(aimDirection);
            
            const rifle = player.getObjectByName('rifle');
            const rifleWorldPosition = new THREE.Vector3();
            rifle?.getWorldPosition(rifleWorldPosition);

            raycaster.set(rifleWorldPosition, aimDirection);
            
            const intersects = raycaster.intersectObjects(scene.children, true);

            for (const intersect of intersects) {
                let hitObject = intersect.object;
                let parentGroup: THREE.Object3D | null = hitObject;
                while (parentGroup && parentGroup.parent !== scene) {
                    parentGroup = parentGroup.parent;
                }
                if (!parentGroup) parentGroup = hitObject;


                const enemy = enemies.find(e => e.mesh === parentGroup);
                if (enemy) {
                    enemy.takeDamage(10);
                    if (enemy.health <= 0) {
                        createRagdoll(enemy.mesh, aimDirection);
                        enemies.splice(enemies.indexOf(enemy), 1);
                    }
                    break;
                }
                
                const destructible = destructibles.find(d => d.mesh === parentGroup || d.mesh === hitObject);
                if (destructible) {
                    destructible.takeDamage(25);
                    break;
                }

                if (parentGroup !== player) {
                    break;
                }
            }
        };
        
        const handleReload = () => {
             if (isReloading || reserveAmmo <= 0 || ammo === MAGAZINE_SIZE) return;
             setIsReloading(true);
             setTimeout(() => {
                const ammoNeeded = MAGAZINE_SIZE - ammo;
                const ammoToReload = Math.min(ammoNeeded, reserveAmmo);
                setAmmo(prev => prev + ammoToReload);
                setReserveAmmo(prev => prev - ammoToReload);
                setIsReloading(false);
             }, RELOAD_TIME);
        }

        const clock = new THREE.Clock();
        const animate = () => {
            if (playerHealth <= 0) return;
            requestAnimationFrame(animate);
            const delta = clock.getDelta();

            isCrouching = keys['ShiftLeft'] || keys['ShiftRight'];
            const speed = PLAYER_SPEED * (isCrouching ? 0.5 : 1);
            const moveDirection = new THREE.Vector3();
            if (keys['KeyW']) moveDirection.z = -1;
            if (keys['KeyS']) moveDirection.z = 1;
            if (keys['KeyA']) moveDirection.x = -1;
            if (keys['KeyD']) moveDirection.x = 1;
            
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            cameraDirection.y = 0;
            cameraDirection.normalize();

            const leftLeg = player.getObjectByName('leftLeg');
            const rightLeg = player.getObjectByName('rightLeg');

            if (moveDirection.lengthSq() > 0) {
                moveDirection.normalize();
                const moveQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), mouseX);
                moveDirection.applyQuaternion(moveQuaternion);
                
                const nextPosition = player.position.clone().add(moveDirection.clone().multiplyScalar(speed * delta));
                if (!checkCollision(nextPosition, worldObjects)) {
                    player.position.copy(nextPosition);
                }

                const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
                    new THREE.Matrix4().lookAt(player.position, player.position.clone().add(cameraDirection), player.up)
                );
                player.quaternion.slerp(targetQuaternion, 0.2);

                walkAnimationTime.current += delta * 10;
                if(leftLeg) leftLeg.rotation.x = Math.sin(walkAnimationTime.current) * 0.5;
                if(rightLeg) rightLeg.rotation.x = -Math.sin(walkAnimationTime.current) * 0.5;

            } else {
                 if(leftLeg) leftLeg.rotation.x = 0;
                 if(rightLeg) rightLeg.rotation.x = 0;
            }

            player.position.y += playerVelocity.y * delta;
            if (player.position.y < 0) {
                 player.position.y = 0;
                 playerVelocity.y = 0;
                 onGround.current = true;
            }
             if (keys['Space'] && onGround.current) {
                playerVelocity.y = PLAYER_JUMP_FORCE;
                onGround.current = false;
            }
            playerVelocity.y += GRAVITY * delta;
            
            if (keys['KeyR']) handleReload();
            
            const targetFOV = isAiming ? 45 : 75;
            camera.fov += (targetFOV - camera.fov) * 0.2;
            camera.updateProjectionMatrix();

            const cameraTargetPosition = player.position.clone().add(new THREE.Vector3(0, 1.8, 0));
            const desiredCameraPosition = cameraTargetPosition.clone().add(cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0,1,0), -mouseX).applyAxisAngle(new THREE.Vector3(1,0,0), -mouseY));
            camera.position.lerp(desiredCameraPosition, 0.1);
            camera.lookAt(cameraTargetPosition);

            enemies.forEach((enemy) => {
                const distanceToPlayer = enemy.mesh.position.distanceTo(player.position);
                if (distanceToPlayer < 15) enemy.state = 'CHASE';
                else if (distanceToPlayer > 20) enemy.state = 'PATROL';
                if(enemy.state === 'CHASE') {
                    const directionToPlayer = player.position.clone().sub(enemy.mesh.position).normalize();
                    const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
                        new THREE.Matrix4().lookAt(enemy.mesh.position, player.position, enemy.mesh.up)
                    );
                    enemy.mesh.quaternion.slerp(targetQuaternion, 0.1);

                    const nextPosition = enemy.mesh.position.clone().add(directionToPlayer.multiplyScalar(2.0 * delta));
                    if (!checkCollision(nextPosition, worldObjects, enemy.mesh.id) && distanceToPlayer > 5) {
                        enemy.mesh.position.copy(nextPosition);
                    }
                } else if (enemy.state === 'PATROL') {
                     if (enemy.mesh.position.distanceTo(enemy.patrolTarget) < 1) {
                         enemy.patrolTarget = enemy.getRandomPatrolPoint();
                     }
                     const direction = enemy.patrolTarget.clone().sub(enemy.mesh.position).normalize();
                     const nextPosition = enemy.mesh.position.clone().add(direction.multiplyScalar(1.5 * delta));
                      if (!checkCollision(nextPosition, worldObjects, enemy.mesh.id)) {
                        enemy.mesh.position.copy(nextPosition);
                     }
                }
            });
            
            // Debris physics
            for(let i = debris.length - 1; i >= 0; i--) {
                const d = debris[i];
                d.velocity.y += GRAVITY * delta;
                d.mesh.position.add(d.velocity.clone().multiplyScalar(delta));
                d.mesh.rotation.x += d.rotationSpeed.x * delta;
                d.mesh.rotation.y += d.rotationSpeed.y * delta;
                d.mesh.rotation.z += d.rotationSpeed.z * delta;
                d.life -= delta;
                if (d.life <= 0) {
                    scene.remove(d.mesh);
                    debris.splice(i, 1);
                }
            }

            renderer.render(scene, camera);
        };

        const checkCollision = (position: THREE.Vector3, obstacles: THREE.Object3D[], selfId?: number) => {
            const playerBox = new THREE.Box3().setFromCenterAndSize(position.clone().add(new THREE.Vector3(0, PLAYER_HEIGHT/2, 0)), new THREE.Vector3(0.8, PLAYER_HEIGHT, 0.8));
            for (const obstacle of obstacles) {
                if(selfId && obstacle.id === selfId) continue;
                if(obstacle === ground) continue;
                const obstacleBox = new THREE.Box3().setFromObject(obstacle);
                if (playerBox.intersectsBox(obstacleBox)) {
                    return true;
                }
            }
            return false;
        }

        animate();

        return () => {
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('click', lockPointer);
        };
    }, [setAmmo, ammo, reserveAmmo, setReserveAmmo, isReloading, setIsReloading, playerHealth, setPlayerHealth]);

    return <div ref={mountRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }} />;
};
